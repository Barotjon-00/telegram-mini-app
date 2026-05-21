import telebot
from telebot import types

BOT_TOKEN = '7698086227:AAE1imyod4JMdoV-pTkATx0uY-blDOQsf6c'

bot = telebot.TeleBot(BOT_TOKEN)

@bot.message_handler(commands=['start'])
def send_welcome(message):
    markup = types.InlineKeyboardMarkup(row_width=1)
    
    # Ссылка на GitHub Pages (будет работать после включения Pages)
    WEB_APP_URL = 'https://barotjon-00.github.io/telegram-mini-app'
    
    web_app = types.WebAppInfo(url=WEB_APP_URL)
    btn = types.InlineKeyboardButton(text="Открыть", web_app=web_app)
    markup.add(btn)
    
    bot.send_message(
        message.chat.id, 
        "🎮 **Добро пожаловать!**\n\n"
        "Нажмите кнопку ниже, чтобы открыть приложение:",
        reply_markup=markup,
        parse_mode='Markdown'
    )

print("✅ Бот запущен...")
bot.polling(none_stop=True)