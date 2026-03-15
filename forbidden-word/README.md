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

## Notes

- Requires `server.js` to be running (Node.js + socket.io)
- All players must be on the same Wi-Fi network
- First player to join becomes the host
- Only the describer sees the word and forbidden list
- 20 built-in word cards; repeats are avoided until the full deck is used