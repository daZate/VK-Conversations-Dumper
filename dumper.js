// VK Messages History Dumper

import * as fs from 'fs';
import { VK } from 'vk-io';


var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const vk = new VK({
	token: config.access_token
});

if(config.id.length < 0) {
	var convs = await vk.api.messages.getConversations()

	convs.forEach(c => {
		config.id[config.id.length] = c.converation.peer
	})
}

var items = []
async function getHistory(id, offset, count) {
	if(count == -1) {
		var htemp = await vk.api.messages.getHistory({offset: 0, count: 0, user_id: config.uid, peer_id: id, rev: 0})
		count = htemp.count
		for(var i = 0; i<Math.floor(count/200); i++) {
			count = count - 200
			var t = await vk.api.messages.getHistory({offset: offset, count: 200, user_id: config.uid, peer_id: id, rev: 0, extended: 0})
			return items.concat(t.items)
		}
		var t = await vk.api.messages.getHistory({offset: offset, count: count, user_id: config.uid, peer_id: id, rev: 0, extended: 0})
		return items.concat(t.items)
	} else {
		if(count >= 200) {
			for(var i = 0; i<Math.floor(count/200); i++) {
				count = count - 200
				var t = await vk.api.messages.getHistory({offset: offset, count: 200, user_id: config.uid, peer_id: id, rev: 0, extended: 0})
				return items.concat(t.items)
			}
			var t = await vk.api.messages.getHistory({offset: offset, count: count, user_id: config.uid, peer_id: id, rev: 0, extended: 0})
			return items.concat(t.items)
		} else {
			for(var i = 0; i<count; i++) {
				var t = await vk.api.messages.getHistory({offset: offset, count: 200, user_id: config.uid, peer_id: id, rev: 0, extended: 0})
				return items.concat(t.items)
			}
		}
		
	}
}

function formatDate(date) {
	return `${(date.getFullYear() < 10) ? "0" : ""}${date.getFullYear()}.${(date.getMonth()+1 < 10) ? "0" : ""}${date.getMonth()+1}.${(date.getDay() + 21 < 10) ? "0" : ""}${date.getDay() + 21} | ${(date.getHours() < 10) ? "0" : ""}${date.getHours()}:${(date.getMinutes() < 10) ? "0" : ""}${date.getMinutes()}:${(date.getSeconds() < 10) ? "0" : ""}${date.getSeconds()}`
}

async function parse(msg) {
	var id = msg.from_id,
	author_isuser = id > 0,
	author = author_isuser ? await vk.api.users.get({user_ids: id}) : await vk.api.groups.getById({group_ids: -id})
	author = author[0]
	var author_name = author_isuser ? `${author.first_name} ${author.last_name} (id${author.id})` : `${author.name} (${author.screen_name})`,
	date = new Date(msg.date * 1000),
	text = msg.text;
	var parsed = [author_name, formatDate(date), text];
	var fwd = msg.reply_message ? [msg.reply_message] : (msg.fwd_messages ? msg.fwd_messages : [])
	var attachments = msg.attachments,
	atts = [];
	attachments.forEach(att => {
		var s = ``
		switch(att.type) {
			case `photo`:
				s = `[Photo (${att.photo.sizes[3].url})]`
			break
			case `doc`:
				s = `[Document ${att.doc.ext.toUpperCase()} (${att.doc.url})]`
			break
			case `sticker`:
				s = `[Sticker (${att.sticker.images[4].url})]`
			break
			case `audio_message`:
				s = `[Audio Message (${att.audio_message.link_mp3})]`
			break
			case `audio`:
				s = `[Audio (${att.audio.artist} - ${att.audio.title}) (${att.audio.url})`
			break
			case `video`:
				s = `[Video (${att.video.title}) (${att.video.player})]`
			break
		}	
		atts.push(s);
	})
	parsed.push(atts);
	parsed.push([]);
	for(var i = 0; i<fwd.length; i++) {
		var m = fwd[i];
		m = await parse(m);
		parsed[4].push(m);
	}
	return parsed;
}

config.id.forEach(id => {
	if(config.display == "both" || config.display == "files") {
		fs.open(`messages/Messages [id${id}].txt`, 'w', err => {if(err) throw err});	
	}
	getHistory(id, 0, config.count).then(items => {
		(async function() {
		for(var z = 0; z<items.length; z++) {
			var item = items[z];
			var parsed = await parse(item);
			var text = `${parsed[0]} (${parsed[1]})\n${parsed[2]}\n`;
			parsed[3].forEach(r => {
				text = text + `${parsed[2].length == 0 ? '' : '\n'}${r}\n`;
			})
			if(parsed[4].length > 0) {
				text = text + `\n{`
				for(var i = 0; i<parsed[4].length; i++){
					var v = parsed[4][i];
					text = text + `\n   ${v[0]} (${v[1]})\n   ${v[2]}\n`;
				}
				text = text + `}`;
			}
			text = text + '\n\n\n';
			switch(config.display) {
				case 'console':
					console.log(text);
				break
				case 'files':
					fs.appendFile(`messages/Messages [id${id}].txt`, text, err => {console.log(err)});
				break
				case 'both':
					console.log(text);
					fs.appendFile(`messages/Messages [id${id}].txt`, text, err => {if(err) throw err;});
				break
			}
		}
		})();
	});
})