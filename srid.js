Downed = new Mongo.Collection('downed');

if (Meteor.isClient) {
  Deps.autorun(function() {
    Meteor.subscribe('userData');
    Meteor.subscribe('downed');
  })

  Accounts.ui.config({
    passwordSignupFields: 'USERNAME_ONLY'
  });

  Template.adminPage.helpers({
    users: function() {
      return Meteor.users.find({username: {$ne: 'admin'}}, {fields:{username:1, profile:1}}).fetch();
    }
  });

  Template.adminPage.events({
    'click #btn-par': function(event) {
      var userList = Meteor.users.find({username: {$ne: 'admin'}}).fetch();
      for (var iterUser of userList) {
        Meteor.users.update({_id: iterUser._id}, {$set: {'profile.status': 'par'}});
      }
    },
    'click #btn-evac': function(event) {
      var userList = Meteor.users.find({username: {$ne: 'admin'}}).fetch();
      for (var iterUser of userList) {
        Meteor.users.update({_id: iterUser._id}, {$set: {'profile.status': 'evac'}});
      }
    },
    'click #btn-clear': function(event) {
      var userList = Meteor.users.find({username: {$ne: 'admin'}}).fetch();
      for (var iterUser of userList) {
        Meteor.users.update({_id: iterUser._id}, {$set: {'profile.status': 'ok'}});
      }
    },
  });

  Template.appPage.helpers({
    statusMessage: function() {
      var curStatus = Meteor.user().profile.status;
      if (curStatus === 'mayday') {
        return 'Mayday Sent';
      } else if (curStatus == 'par') {
        return 'Report PAR';
      } else if (curStatus == 'evac') {
        return 'Evac NOW';
      } else if (curStatus == 'mandown') {
        return 'Man Down: ' + Downed.findOne({})['down'];
      }
    }
  })

  Template.appPage.events({
    'click #btn-oxy-plus': function(event) {
      if (Meteor.user().profile.oxygen < 100) {
        Meteor.users.update({_id: Meteor.user()._id}, {$inc: {'profile.oxygen': 5}});
      }
    },
    'click #btn-oxy-minus': function(event) {
      if (Meteor.user().profile.oxygen > 0) {
        Meteor.users.update({_id: Meteor.user()._id}, {$inc: {'profile.oxygen': -5}});
      }
    },
    'click #btn-ack': function(event) {
      Meteor.users.update({_id: Meteor.user()._id}, {$set: {'profile.status': 'ok'}});
    },
    'click #btn-mayday': function(event) {
      Meteor.users.update({_id: Meteor.user()._id}, {$set: {'profile.status': 'mayday'}});
    },
  });

  Template.firefighter.helpers({
    statusNote: function(curStatus) {
      if (curStatus === 'mayday') {
        return 'Sending MAYDAY';
      } else if (curStatus == 'par') {
        return 'Received PAR';
      } else if (curStatus == 'evac') {
        return 'Received Evacuate';
      } else if (curStatus == 'mandown') {
        return 'Received Man Down';
      } else if (curStatus == 'ok') {
        return 'OK';
      }
    },
    statusAlert: function(curStatus) {
      if (curStatus === 'mayday') {
        return 'danger';
      } else if (curStatus == 'par') {
        return 'warning';
      } else if (curStatus == 'evac') {
        return 'info';
      } else if (curStatus == 'mandown') {
        return 'warning';
      } else if (curStatus == 'ok') {
        return 'success';
      }
    },
    progressBarRed: function(oxygen) {
      if (oxygen >= 50) {
        return "";
      } else if (oxygen >= 25) {
        return "progress-bar-warning";
      } else {
        return "progress-bar-danger";
      }
    },
    panelRed: function(oxygen, status) {
      if (oxygen < 25 || status == 'mayday') {
        return "panel-danger";
      } else {
        return "panel-default";
      }
    }
  });

  Template.firefighter.events({
    'click .btn-down': function(event) {
      var curId = event.target.id.split('-')[1];
      var docId = Downed.findOne({})['_id'];
      var curName = Meteor.users.findOne({_id: curId})['username'];
      Downed.update(docId, {$set: {down: curName}})
      var userList = Meteor.users.find({_id: {$ne: curId}}).fetch();
      for (var iterUser of userList) {
        Meteor.users.update({_id: iterUser._id}, {$set: {'profile.status': 'mandown'}});
      }
    },
    'click .btn-single-par': function(event) {
      var curId = event.target.id.split('-')[1];
      Meteor.users.update({_id: curId}, {$set: {'profile.status': 'par'}});
    },
    'click .btn-single-evac': function(event) {
      var curId = event.target.id.split('-')[1];
      Meteor.users.update({_id: curId}, {$set: {'profile.status': 'evac'}});
    }
  });

  Template.registerHelper('isAdmin', function() {
    return Meteor.user().username == 'admin';
  });

  Template.registerHelper('isStatus', function(status) {
    return Meteor.user().profile.status == status;
  });
}

if (Meteor.isServer) {
  Meteor.startup(function() {
    Downed.remove({});
    Downed.insert({down: 'nobody'});
  });

  Meteor.publish('userData', function() {
    return Meteor.users.find({username: {$ne: 'admin'}});
  });

  Meteor.publish('downed', function() {
    return Downed.find({});
  });

  Meteor.users.allow({
    'update': function() {
      return true;
    }
  });

  Accounts.onCreateUser(function(options, user) {
    if (options.profile) {
      user.profile = options.profile;
    }
    user.profile.oxygen = 100;
    user.profile.status = 'ok';
    return user;
  });
}