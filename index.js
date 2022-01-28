const Discord = require("discord.js")
const { google } = require("googleapis")
const config = require('./config.json')

const init = async() => {
    const client = await google.discoverAPI(config.perspective.DISCOVERY_URL)
    
    const bot = new Discord.Client({
        intents: [
            "GUILDS",
            "GUILD_MESSAGES"
        ]
    })
    bot.on('messageCreate', async (message) => {
        const analyzeRequest = {
            comment: {
                text: message.content,
            },
            requestedAttributes: {
                TOXICITY: {},
            },
            languages: ["en"]
        };
        if (message.author.bot) return;

        await client.comments.analyze(
            {
              key: config.perspective.API_KEY,
              resource: analyzeRequest,
            },
            async (err, response) => {
              if (err) throw err;
              if (!response) {
                console.log("Failed on message: %d SPLIT, content: %s", message.id, message.content)
              } else {
                const { attributeScores } = response.data;
                const value = Math.round(attributeScores.TOXICITY.summaryScore.value * 100)
                let msg;
                if (value > config.discord.thresholds.TOXICITY.flag) {
                    try {
                        const channel = await bot.channels.fetch(config.discord.channels.toxicity)
                        msg = await channel.send({
                            embeds: [
                                new Discord.MessageEmbed()
                                    .setTitle("Flagged message")
                                    .setDescription(`Matched [TOXICITY] with a score of ${value}\n\`\`\`\n${message.cleanContent}\n\`\`\``)
                                    .addFields({
                                        name: "ID",
                                        value: `\`${message.id}\``,
                                        inline: true
                                    }, {
                                        name: "Link",
                                        value: `[Jump!](https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id})`,
                                        inline: true
                                    }, {
                                        name: "Timestamp",
                                        value: `<t:${Math.floor(message.createdTimestamp / 1000)}:F> which was <t:${Math.floor(message.createdTimestamp / 1000)}:R>`,
                                        inline: true
                                    })
                                    .setFooter({
                                        text: `${message.author.tag} | ${message.author.id}`,
                                        iconURL: message.author.avatarURL()
                                    })
                                    .setColor(getColor(value))
                            ]
                        })
                    } catch (err) {
                        throw err; // suck my ass error
                    }
                }
                if (value > config.discord.thresholds.TOXICITY.delete) {
                    if (msg) {
                        await message.delete()
                        await msg.reply({
                            content: `**Message reached a score of >${config.discord.thresholds.TOXICITY.delete} (${value}) and has been deleted**`
                        })
                    }
                }
              }
            });
        
    })
    bot.on('messageUpdate', async (_oldMessage, message) => {
        const analyzeRequest = {
            comment: {
                text: message.content,
            },
            requestedAttributes: {
                TOXICITY: {},
            },
            languages: ["en"]
        };
        if (message.author.bot) return;

        await client.comments.analyze(
            {
              key: config.perspective.API_KEY,
              resource: analyzeRequest,
            },
            async (err, response) => {
              if (err) throw err;
              if (!response) {
                console.log("Failed on message: %d SPLIT, content: %s", message.id, message.content)
              } else {
                const { attributeScores } = response.data;
                const value = Math.round(attributeScores.TOXICITY.summaryScore.value * 100)
                let msg;
                if (value > config.discord.thresholds.TOXICITY.flag) {
                    try {
                        const channel = await bot.channels.fetch(config.discord.channels.toxicity)
                        msg = await channel.send({
                            embeds: [
                                new Discord.MessageEmbed()
                                    .setTitle("Flagged message")
                                    .setDescription(`Matched [TOXICITY] with a score of ${value}\n\`\`\`\n${message.cleanContent}\n\`\`\``)
                                    .addFields({
                                        name: "ID",
                                        value: `\`${message.id}\``,
                                        inline: true
                                    }, {
                                        name: "Link",
                                        value: `[Jump!](https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id})`,
                                        inline: true
                                    }, {
                                        name: "Timestamp",
                                        value: `<t:${Math.floor(message.editedTimestamp / 1000)}:F> which was <t:${Math.floor(message.editedTimestamp / 1000)}:R>`,
                                        inline: true
                                    }, {
                                        name: "Notes",
                                        value: `Message was edited`,
                                        inline: false
                                    })
                                    .setFooter({
                                        text: `${message.author.tag} | ${message.author.id}`,
                                        iconURL: message.author.avatarURL()
                                    })
                                    .setColor(getColor(value))
                            ]
                        })
                    } catch (err) {
                        throw err; // suck my ass error
                    }
                }
                if (value > config.discord.thresholds.TOXICITY.delete) {
                    if (msg) {
                        await message.delete()
                        await msg.reply({
                            content: `**Message reached a score of >${config.discord.thresholds.TOXICITY.delete} (${value}) and has been deleted**`
                        })
                    }
                }
              }
            });
        
    })
    bot.on('ready', () => {
        console.log('connected to ws')
    })

    bot.login(config.discord.TOKEN)

}
init()

/**
 * @param {number} value
 * @returns {string}
 */
function getColor(value) {
    if (value <= 50) {
        return "#2ecc71"
    } else if(value <= 65) {
        return "#f1c40f"
    } else if (value <= 80) {
        return "#e67e22"
    } else if (value <= 90) {
        return "#e74c3c"
    } else {
        return "#eb2f06"
    }
}