$(document).ready(function () {

  Parse.initialize("eKsGI0gYt6LobUiG66gHWCgjuLx9ZmeWn9XKyVDW", "ewHQdR7hLUgfIqxvUwiCnxnt7ZOjkb325rd1IeUt");
  var currentUser = Parse.User.current();
  if (currentUser) {
      showChat();
      console.log("1");
  } else {
      hideContent('#loginButtons');
      console.log("2");

  }
  // var Parse = require('parse');

  ////
  // PubNub Decorator
  // -------------------
  // This wraps the pubnub libarary so we can handle the uuid and list
  // of subscribed channels.
  ////
  function PubNub() {
    this.publishKey = 'pub-c-c202562b-e396-4abe-aa0d-3f2f120bb2d0';
    this.subscribeKey = 'sub-c-2f8618a4-c17b-11e5-b684-02ee2ddab7fe';
    this.subscriptions = localStorage["pn-subscriptions"] || [];

    if(typeof this.subscriptions == "string") {
      this.subscriptions = this.subscriptions.split(",");
    }
    this.subscriptions = $.unique(this.subscriptions);
  }

  PubNub.prototype.connect = function(username) {
    this.username = username;
    this.connection = PUBNUB.init({
      publish_key: this.publishKey,
      subscribe_key: this.subscribeKey,
      uuid: this.username
    });
  };

  PubNub.prototype.addSubscription = function(channel) {
    this.subscriptions.push(channel);
    this.subscriptions = $.unique(this.subscriptions);
  };

  PubNub.prototype.removeSubscription = function(channel) {
    if (this.subscriptions.indexOf(channel) !== -1) {
      this.subscriptions.splice(this.subscriptions.indexOf(channel), 1);
    }
    this.saveSubscriptions();
  };

  PubNub.prototype.saveSubscriptions = function() {
    localStorage["pn-subscriptions"] = this.subscriptions;
  };

  PubNub.prototype.subscribe = function(options) {
    this.connection.subscribe.apply(this.connection, arguments);
    this.addSubscription(options.channel);
    this.saveSubscriptions();
  };

  PubNub.prototype.unsubscribe = function(options) {
    this.connection.unsubscribe.apply(this.connection, arguments);
  };

  PubNub.prototype.publish = function() {
    this.connection.publish.apply(this.connection, arguments);
  };

  PubNub.prototype.history = function() {
    this.connection.history.apply(this.connection, arguments);
  };

  var chatChannel = '',
      username = '',
      users = [],
      usernameInput = $('#username'),
      chatRoomName = $("#chatRoomName"),
      newChatButton = $("#newChatButton"),
      chatListEl = $("#chatList"),
      sendMessageButton = $("#sendMessageButton"),
      backButton = $("#backButton"),
      messageList = $("#messageList"),
      messageContent = $("#messageContent"),
      userList = $("#userList"),
      pubnub = new PubNub(),
      isBlurred = false,
      timerId = -1,
      pages = {
        home: $("#homePage"),
        chatList: $("#chatListPage"),
        chat: $("#chatPage"),
        delete: $("#delete")
      };

  // Blur tracking
  $(window).on('blur', function () {
    isBlurred = true;
  }).on("focus", function () {
    isBlurred = false;
    clearInterval(timerId);
    document.title = "Pub Messenger";
  });

  // Request permission for desktop notifications.
  var notificationPermission = 1;
  if (window.webkitNotifications) {
    notificationPermission = window.webkitNotifications.checkPermission();

    if (notificationPermission === 1) {
      window.webkitNotifications.requestPermission(function (event) {
        notificationPermission = window.webkitNotifications.checkPermission();
      });
    }
  }

  ////////
  // Home View
  /////
  function HomeView() {

    if (currentUser) {
      Parse.User.current().fetch().then(function (user) {
          username = user.get('username');
      });
      // username = "user";
      pubnub.connect(username);


      chatChannel = "TestChannel";
      $.mobile.changePage(pages.chat);

      showChat();
    } else {
        // hideContent('#signup');
        console.log("shouldn't be here");
    }
  };

  /////
  // Chat List View
  ///////
  function ChatListView(event, data) {
    
    chatChannel = "TestChannel";

    $.mobile.changePage(pages.chat);
  };

  //////
  // Delete Chat View
  ///////
  function DeleteChatView(event, data) {
    if (data.options && data.options.link) {
      var channelName = data.options.link.attr('data-channel-name'),
          deleteButton = pages.delete.find("#deleteButton");

      deleteButton.unbind('click');
      deleteButton.click(function (event) {
        pubnub.removeSubscription(channelName);
        console.log(pages.delete.children());
        pages.delete.find('[data-rel="back"]').click();
      });
    }
  };

  /////
  // Chatting View
  //////
  function ChatView(event, data) {
    var self = this;

    if (data.options && data.options.link) {
      chatChannel = data.options.link.attr('data-channel-name');
    }

    users = [];
    messageList.empty();
    userList.empty();

    pubnub.unsubscribe({
      channel: chatChannel
    });

    pubnub.subscribe({
      channel: chatChannel,
      message: self.handleMessage,
      presence   : function( message, env, channel ) {
        if (message.action == "join") {
          users.push(message.uuid);
          userList.append("<li data-username='" + message.uuid + "'>" + message.uuid + "</li>");
        } else {
          users.splice(users.indexOf(message.uuid), 1);
          userList.find('[data-username="' + message.uuid + '"]').remove();
        }

        userList.listview('refresh');
      }
    });

    // Handle chat history
    pubnub.history({
      channel: chatChannel,
      limit: 100
    }, function (messages) {
      messages = messages[0];
      messages = messages || [];

      for(var i = 0; i < messages.length; i++) {
        self.handleMessage(messages[i], false);
      }

      $(document).scrollTop($(document).height());
    });

    // Change the title to the chat channel.
    pages.chat.find("h1:first").text(chatChannel);

    messageContent.off('keydown');
    messageContent.bind('keydown', function (event) {
      if((event.keyCode || event.charCode) !== 13) return true;
      sendMessageButton.click();
      return false;
    });

    sendMessageButton.off('click');
    sendMessageButton.click(function (event) {
      console.log("message sent");
      var message = messageContent.val();

      if(message !== "") {
        pubnub.publish({
          channel: chatChannel,
          message: {
            username: username,
            text: message
          }
        });

        messageContent.val("");
      }
    });

    backButton.off('click');
    backButton.click(function (event) {
      pubnub.unsubscribe({
        channel: chatChannel
      });
    });
  };

  // This handles appending new messages to our chat list.
  ChatView.prototype.handleMessage = function (message, animate) {
    if (animate !== false) animate = true;

    var messageEl = $("<li class='message'>"
        + "<span class='username'>" + message.username + "</span>"
        + message.text
        + "</li>");
    messageList.append(messageEl);
    messageList.listview('refresh');

    // Scroll to bottom of page
    if (animate === true) {
      $("html, body").animate({ scrollTop: $(document).height() - $(window).height() }, 'slow');
    }

    if (isBlurred) {
      // Flash title if blurred
      clearInterval(timerId);
      timerId = setInterval(function () {
        document.title = document.title == "Pub Messenger" ? "New Message" : "Pub Messenger";
      }, 2000);

      // Notification handling
      if (notificationPermission === 0 && message.username !== username) {
        var notification = window.webkitNotifications.createNotification(
          'icon.jpg',
          'PubNub Messenger Notification',
          message.username + " said " + message.text
        );

        notification.onclick = function () {
          notification.close();
        }

        notification.show();
      }
    }
  };

  // Initially start off on the home page.
  $.mobile.changePage(pages.home);
  var currentView = new HomeView();

  // This code essentially does what routing does in Backbone.js.
  // It takes the page destination and creates a view based on what
  // page the user is navigating to.
  $(document).bind("pagechange", function (event, data) {
    if (data.toPage[0] == pages.chatList[0]) {
      currentView = new ChatListView(event, data);
    } else if (data.toPage[0] == pages.delete[0]) {
      currentView = new DeleteChatView(event, data);
    } else if (data.toPage[0] == pages.chat[0]) {
      currentView = new ChatView(event, data);
    }
  });
});

function showContent(id) {
    $('.loginButtons').fadeOut('fast');

    setTimeout(function(){
        $(id).fadeIn('slow');
    }, 400);

}

function hideContent(id) {
    $(id).fadeOut('slow');

    setTimeout(function(){
        $('.loginButtons').fadeIn('fast');
    }, 400);

}

function showChat() {
    $('.pure-form').fadeOut('fast');
    $('.loginButtons').fadeOut('fast');
    $('.upload-page').fadeOut('fast');

    setTimeout(function(){
        chatChannel = "TestChannel";

        $('#chatPage').fadeIn('fast');
    }, 400);

}

function createUser() {
    var user = new Parse.User();
    var nameValue = document.getElementById("nameID").value;
    var keyValue = document.getElementById("keyID").value;
    var pwValue = document.getElementById("pwID").value;
    var emailValue = document.getElementById("emailID").value;
    // console.log(nameValue);
    // console.log(keyValue);
    // console.log(pwValue);
    // console.log(emailValue);

    user.set("username", keyValue);
    user.set("name", nameValue);
    user.set("password", pwValue);
    user.set("email", emailValue);
      
    user.signUp(null, {
      success: function(user) {
        showUploadPage();
      },
      error: function(user, error) {
        // Show the error message somewhere and let the user try again.
        alert("Error: " + error.code + " " + error.message);
      }
    });
}

function getUser() {
  var keyValue = document.getElementById("loginKeyID").value;
  var pwValue = document.getElementById("loginPwID").value;
  Parse.User.logIn(keyValue, pwValue, {
    success: function(user) {
      // Do stuff after successful login.
      showChat();
      console.log("parse logged me in");
    },
    error: function(user, error) {
      // The login failed. Check error to see why.
      alert("Error: " + error.code + "Log in failed. Incorrect pennkey and/or password.");
    }
  });
}

function logout() {
  Parse.User.logOut();
  $('#chatListPage').fadeOut('fast');
  $('#chatPage').fadeOut('fast');
  $('#delete').fadeOut('fast');
  $('.about-page').fadeOut('fast');
  $('.upload-page').fadeOut('fast');
  


  setTimeout(function(){
      $('.loginButtons').fadeIn('fast');
  }, 400);
}

function showAbout() {
  $('.pure-form').fadeOut('fast');
  $('.loginButtons').fadeOut('fast');
  $('#chatListPage').fadeOut('fast');
  $('#chatPage').fadeOut('fast');
  $('#delete').fadeOut('fast');
  $('.upload-page').fadeOut('fast');
  
  setTimeout(function(){
      $('.about-page').fadeIn('fast');
  }, 200);
}

function showHome() {
  location.reload();
}

function showUploadPage() {
  $('.pure-form').fadeOut('fast');
  $('.loginButtons').fadeOut('fast');
  $('#chatListPage').fadeOut('fast');
  $('#chatPage').fadeOut('fast');
  $('#delete').fadeOut('fast');

  setTimeout(function(){
      $('.upload-page').fadeIn('fast');
  }, 200);
}