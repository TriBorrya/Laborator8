//Discord 
const Discord = require("discord.js");
const client = new Discord.Client({
	allowedMentions: {
    	parse: [],
    	repliedUser: false,
	},
	partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
	intents: [
	  Discord.Intents.FLAGS.GUILDS,
      Discord.Intents.FLAGS.GUILD_MEMBERS,
      Discord.Intents.FLAGS.GUILD_BANS,
      Discord.Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
      Discord.Intents.FLAGS.GUILD_INTEGRATIONS,
      Discord.Intents.FLAGS.GUILD_WEBHOOKS,
      Discord.Intents.FLAGS.GUILD_INVITES,
      Discord.Intents.FLAGS.GUILD_VOICE_STATES,
      Discord.Intents.FLAGS.GUILD_PRESENCES,
      Discord.Intents.FLAGS.GUILD_MESSAGES,
      Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
	  Discord.Intents.FLAGS.GUILD_MESSAGE_TYPING,
	  Discord.Intents.FLAGS.DIRECT_MESSAGES,
      Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
      Discord.Intents.FLAGS.DIRECT_MESSAGE_TYPING,
	],
});

//Collections
client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();

//Packages
const db = require("quick.db");
const fs = require("fs");
const config = require("./config.json");
const { MessageEmbed } = require("discord.js");

client.on("ready", async() => {
	console.log(`${client.user.username} is online | ${client.users.cache.size} Users`)
	client.user.setActivity(`node3.justpaul.ro`, { type: "LISTENING" })
})

//Directory handler
fs.readdirSync('./commands/').forEach(dir => {
  const commands = fs.readdirSync(`./commands/${dir}`).filter(file => file.endsWith(".js"));
  for(let file of commands){
    let cmd = require(`./commands/${dir}/${file}`);
    if(cmd.name){
      client.commands.set(cmd.name, cmd);
      console.log(`✅ - ${file}`);
    } else {
      console.log(`❌ - ${file} (${dir})`);
    }
    if(cmd.aliases && Array.isArray(cmd.aliases)) cmd.aliases.forEach(alias => client.aliases.set(alias, cmd.name));
  }
});

//Message command handler
client.on("messageCreate", async message => {
  
  if(message.author.bot) return false;
  if(!message.guild) return false;
  var guildprefix = db.get(`gprefix_${message.guild.id}`);
  if(guildprefix === null) guildprefix = config.bot.prefix;
  var params = message.content.substring().split(" ");
  params[0] = params[0].toLowerCase();
  //client.commands.get('nonprefix').execute(client, message, params, guildprefix, Discord, MessageEmbed, config, db);
  let replyBot = new Discord.MessageEmbed().setColor(config.embeds.color).setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() }).setDescription(`**Prefix in use: `+"`"+`${guildprefix}`+"`**"+`\nActual server: **${message.guild.name}**`)
  if(params[0] && message.mentions.members.first() == client.user.id && !params[1]) {
    message.channel.send({embeds: [replyBot]}); 
  } else {
      var cmd;
      if(!message.content.startsWith(guildprefix)) return false;
      cmd = params[0].slice(guildprefix.length).toLowerCase();
    
	  if(cmd.length === 0) return false;
	  let command = client.commands.get(cmd);
	  if(!command) command = client.commands.get(client.aliases.get(cmd));
	  if(db.has(`checkcmd_${message.guild.id}_${command}`)) return false;
	  if (command) command.execute(client, message, params, guildprefix, Discord, MessageEmbed, config, db);
  }
})

client.on("userUpdate", async (oldUser, newUser) => {
	
	//Auto-Family Variables
	
	let guild = client.guilds.cache.get(config.guild.id);
	let member = guild.members.cache.get(newUser.id);

	let tag = db.get(`svTag_${guild.id}`);
	if(tag === null) tag = config.guild.tag;
	if(!tag || tag == "tag_here") return console.log(`Seteaza in mortii tai un tag cu comanda ${config.bot.prefix}settag`)

	let roleId = db.get(`roleId_${guild.id}`);
	if(roleId === null) roleId = config.guild.roleId;
	let role = guild.roles.cache.get(roleId);
	if(!role) return console.log(`Bai pula nu exista asa rol, seteaza altu cu comanda ${config.bot.prefix}setrole`)
		
	let logsId = db.get(`logs_${guild.id}`);
	if(logsId === null) logsId = config.guild.logs;
	let logs = guild.channels.cache.get(logsId);
	if(!logs) return console.log(`Serverul nu are canal de logs, plm trimit si eu unde pica. Foloseste ${config.bot.prefix}setlogs`)

	let addedRole = new MessageEmbed({ color: config.embeds.color, description: `${newUser} a pus tag-ul \`(${tag})\` si a primit rolul ${role}` })
	let removedRole = new MessageEmbed({ color: "RED", description: `${newUser} a scos tag-ul (${tag})` })
	
	//Auto-Family Start

	let status = db.get(`on_off_${guild.id}`);
	if(status === null) status = "on";
	if(status != "on") return false;

	if(newUser.username.includes(tag)){
		if(member.roles.cache.has(role.id)) return false;
		member.roles.add(role.id);
		logs.send({embeds: [addedRole]});
	} else {
		if(!member.roles.cache.has(role.id)) return false;
		member.roles.remove(role.id);
		logs.send({embeds: [removedRole]});
	}

	//Auto-Family End

})

client.login(config.bot.token)
