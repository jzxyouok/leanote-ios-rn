// 来自desktop-app
// 待修改

var db = require('../DB/Sqlite');
var Common = require('./common');
var User = require('./user');
// var Note = require('note');
var Web = require('./web');
var Tags = db.tags;
/*
TagId
ServerTagId
Title
Usn
IsDirty
CreatedTime
UpdatedTime
Count 笔记数

*/
// 笔记本服务
var Tag = {

	// 添加或更新标签
	addOrUpdateTag: function(title, callback, isForce, usn) {
		var userId = User.getCurActiveUserId();
		Tags.findOne({UserId: userId, Tag: title}, function(err, tag) {
			// 存在, 则更新该tag下的笔记数量
			// 已存的, 不更新IsDirty
			var Note = require('./note');
			if(!err && tag) {
				Note.countNoteByTag(title, function(cnt) {
					tag.Count = cnt;
					Tags.update({UserId: userId, Title: title}, {$set: {Count: cnt, UpdatedTime: new Date()}}, function() {
						console.log('已存在tag' + title);
						callback(tag);
					});
				});
			} else {
				var date = new Date();
				Tags.insert({
					TagId: Common.objectId(), 
					UserId: userId, 
					Tag: title, 
					IsDirty: !isForce, // 新添加的
					Usn: usn, // 在isForce == true时用, 服务器添加过来的
					Count: 1,
					LocalIsDelete: false,
					CreatedTime: date,
					UpdatedTime: date
				}, function(err, doc) {
					if(err) {
						callback && callback({Ok: false, Inserted: false});
					} else {
						callback && callback(doc);
					}
				});
			}
		});
	},
	getTags: function(callback) {
		Tags.find({UserId: User.getCurActiveUserId(), LocalIsDelete: false}, function(err, tags) {
			if(err) {
				callback && callback(false);
			} else {
				callback && callback(tags);
			}
		});
	},

	// 删除标签, 更新为LocaleIsDelete = true
	deleteTag: function(title, callback, isForce) {
		var me = this;
		Tags.update({UserId: User.getCurActiveUserId(), Tag: title}, {$set: {LocalIsDelete: true, IsDirty: !isForce, UpdatedTime: new Date()}}, function() {
		});
		// 
		var Note = require('./note');
		console.log(Note);
		Note.updateNoteToDeleteTag(title, function(updates) {
			callback && callback(updates);
		});
	},

	// 更新标签的数量, 在彻底删除笔记时调用
	updateTagCount: function(title, count) {
		userId = User.getCurActiveUserId();
		// 更新Tag's Count
		Tags.update({UserId: userId, Tag: title}, {$set: {Count: count}});
		// 更新web
		Web.updateTagCount({Tag: title, Count: count});
	},

	getTag: function(title, callback) {
		var userId = User.getCurActiveUserId();
		Tags.findOne({UserId: userId, Tag: title}, function(err, tag) {
			if(err || !tag) {
				return callback && callback(false);
			}
			callback && callback(tag);
		});
	},

	// 添加tag后的返回, 更新usn
	updateTagForce: function(tag, callback) {
		var me = this;
		tag.IsDirty = false;
		var userId = User.getCurActiveUserId();
		Tags.update({UserId: userId, Tag: tag.Tag}, {$set: tag}, function() {
			callback && callback();
		});
	},

	// 服务器上更新过来, 已经存在了
	setNotDirty: function(title) {
		var me  = this;
		var userId = User.getCurActiveUserId();
		Tags.update({UserId: userId, Tag: title}, {$set: {IsDirty: false, UpdatedTime: new Date()}}, function() {
		});
	},

	// 更新过来的, 本地有了, 要设置usn, 因为删除的时候要用
	setNotDirtyAndUsn: function(title, usn) {
		var me  = this;
		var userId = User.getCurActiveUserId();
		Tags.update({UserId: userId, Tag: title}, {$set: {IsDirty: false, Usn: usn, UpdatedTime: new Date()}}, function() {
		});
	},

	// send changes to server
	getDirtyTags: function(callback) {
		var me = this;
		userId = User.getCurActiveUserId();
		Tags.find({UserId: userId, IsDirty: true}, function(err, tags) {
			if(err || !tags) {
				return callback && callback(false);
			}
			callback && callback(tags);
		});
	},
	/*
	// 添加多个标签
	addTags: function(titles) {
		for(var i in titles) {
			var title = titles[i];
			this.addTag(title);
		}
	},
	// 添加标签, 先查询是否存在
	addTag: function(title, callback) {
		var userId = User.getCurActiveUserId();
		Tags.count({UserId: userId, Title: title}, function(err, count) {
			if(count) {
				callback && callback({Ok: false, IsExists: true});
			} else {
				var date = new Date();
				Tags.insert({
					TagId: Common.objectId(), 
					UserId: userId, 
					Title: title, 
					CreatedTime: date,
					UpdatedTime: date
				}, function(err, doc) {
					if(!err) {
						callback && callback({Ok: false, Inserted: false});
					} else {
						callback && callback(doc);
					}
				});
			}
		});
	},
	// 更新标签标题
	updateTagTitle: function(tagId, Title, callback) {
		userId = User.getCurActiveUserId();
		// Tags.update({TagId: tagId, userId: userId}, {$set: {NumberNotes: count}}, {})
		Tags.update({TagId: tagId, userId: userId}, {$set: {Title: title}}, {}, function(err) {
			if(err) {
				callback && callback(false);
			} else {
				callback && callback(true);
			}
		});
	},
	*/
};
module.exports = Tag;