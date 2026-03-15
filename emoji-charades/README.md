# Emoji Charades

A multiplayer party game where one player describes a secret word using ONLY emojis, and everyone else tries to guess it. No words allowed — just emojis! 🎭

## Controls

| Key / Gesture | Action |
|---|---|
| Tap "Join Game" | Enter the room |
| Tap "▶ Start Round" | Host starts — one player becomes the describer |
| Type emojis + "Send Emoji Clue" | Describer sends emoji hints |
| Type guess + "Submit Guess" | Guessers try to solve it |
| Tap "⏭ Skip Word" | Host skips to a new word |
| Tap "⏭ Next Describer" | Host rotates who describes |

## Files

| File | Purpose |
|---|---|
| index.html | Layout and screens |
| game.js | All game logic + Socket.IO |
| style.css | Dark theme + game styles |

## Notes

- Requires `server.js` running (Node.js + Socket.IO)
- All players must be on the same Wi-Fi network
- First player to join becomes the host
- Only the describer sees the secret word
- Describers can ONLY send emojis (no text allowed!)
- 40 built-in words across different categories

## How to Play

1. Start server: `npm start` (runs on port 3000)
2. All players open `http://[server-ip]:3000/emoji-charades/`
3. First player becomes the host
4. Host clicks "Start Round" — one player becomes the describer
5. Describer sees a secret word and must explain it using only emojis
6. Describer types emojis and clicks "Send Emoji Clue"
7. Other players see the emoji clues and type their guesses
8. First person to guess correctly wins the round!
9. Host can skip difficult words or rotate to the next describer

## Word Categories

- **Movies:** Titanic, Star Wars, Frozen, Avatar, etc.
- **Objects:** Pizza, Guitar, Rainbow, Mountain, etc.
- **Actions:** Dancing, Swimming, Sleeping, Running, etc.
- **Famous People:** Einstein, Shakespeare, Cleopatra, etc.

## Tips for Describers

- Use multiple emojis to build a picture
- Think about how to represent abstract concepts
- Be creative — there's no one right answer!
- Example: "Titanic" might be: 🚢 ❄️ 💔 🌊

## Tips for Guessers

- Look at the emoji sequence as a whole
- Think outside the box
- Type your guesses quickly!
- Don't overthink it — first instinct is often right