# Forbidden Word

A real-time multiplayer party game. The describer must explain a secret word **without** saying any of the forbidden words. Everyone else tries to guess it.

## Controls

| Key / Gesture        | Action                        |
|---|---|
| Tap "Join Game"      | Enter the room                |
| Tap "▶ Start Round"  | Host starts — describer gets the card |
| Tap "✅ Word Guessed" | Host marks the round as won  |
| Tap "🚫 Forbidden…"  | Describer self-reports a slip |
| Tap "⏭ Next Describer" | Host rotates who describes  |

## Files

| File        | Purpose                  |
|---|---|
| index.html  | Layout and screens       |
| game.js     | All game logic           |
| style.css   | Dark theme + game styles |

## Notes

- Requires `server.js` to be running (Node.js + socket.io)
- All players must be on the same Wi-Fi network
- First player to join becomes the host
- Only the describer sees the word and forbidden list
- 20 built-in word cards; repeats are avoided until the full deck is used

## How to Play

1. Start the server: `npm start` (runs on port 3000)
2. All players open `http://[server-ip]:3000/forbidden-word/` on their devices
3. First player becomes the host
4. Host clicks "Start Round" — one player becomes the describer
5. Describer sees a word and forbidden words they cannot say
6. Describer explains the word without using forbidden words
7. Other players try to guess
8. Host clicks "Word Guessed" when someone gets it right
9. Describer clicks "Forbidden word" if they slip up
10. Host can rotate to next describer or start new round