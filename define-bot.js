var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
const puppeteer = require('puppeteer');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

// Log when the bot is ready
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

// Configure bot to search new messages for !define and look up the definition of the word that follows
bot.on('message', function (user, userID, channelID, message, evt) {

    if (message.includes("!define") && user!="Define Bot") {
        var regex = /\!define\s+(\w+)/g;
        var match = regex.exec(message);
        var word = capitaliseFirstLetter(match[1]);

        // Search dictionary.com for given word and return result
        let scrape = async () => {
          const browser = await puppeteer.launch();
          const page = await browser.newPage();
          await page.setViewport({width: 1280, height: 720})
          await page.goto('https://www.dictionary.com/browse/' + word);
          await page.waitFor(2000);
          var selector = '#initial-load-content > main > section > section > section:nth-child(3) > div > div.css-8lgfcg.e1iplpfw1 > ol > li';

          // Make sure the given word exists
          if (await page.$(selector, {timeout: 5000}) == null) {
            return 'No results for \'' + word + '\'';
          }

          // Search page for definition
          const definition = await page.evaluate(() => {
            return document.querySelector('#initial-load-content > main > section > section > section:nth-child(3) > div > div.css-8lgfcg.e1iplpfw1 > ol > li').innerText;
          });

          browser.close();
          return word + ': '+ definition;
        };

        scrape().then((result) => {
            // Send message with the scraped definition
            bot.sendMessage({
              to: channelID,
              message: result
            })
        });
     }
});

// Capitalise first letter of string for formatting
function capitaliseFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
};
