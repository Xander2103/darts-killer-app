🎯 Darts Killer App

An advanced browser-based darts game built in JavaScript, featuring classic Killer mode and an extended Chaos mode with dynamic gameplay modifiers.

This project focuses on game logic, modular architecture, player state management, and interactive UI design.

📸 Preview  
Can be found in the repository files.

---

🚀 Features

### 🎯 Core Gameplay
- Full Killer mode implementation
- Turn-based gameplay system
- Dynamic score tracking and updates
- Player states (alive, killer, immune, pending elimination)
- Undo system (state snapshots)

### 🌪️ Chaos Mode (Advanced)
- Random gameplay modifiers (modular system)
- Weighted random selection (rare vs common events)
- Modifier cooldown system (prevents repetition)
- Turn-based OR round-based modifier system

### 🧩 Chaos Modifiers
Includes multiple modifiers such as:
- Double Trouble / Triple Trouble
- Bonus Darts
- No Miss
- Target Lock
- Safe Zone
- One Shot
- Double Damage
- Hot Streak
- Vampire Mode
- Revival (revives a dead player)
- Instant Kill (ultra rare high-risk modifier)

Each modifier:
- Has its own logic
- Can be enabled/disabled
- Can define availability conditions
- Supports weighted spawn chances

---

🧠 Game Logic

The application includes advanced logic for:

- Player lifecycle management (alive, dead, revival)
- Killer progression system
- Immunity and targeting rules
- Recovery system before elimination
- Exact-zero vs below-zero elimination logic
- Chaos modifier lifecycle:
  - onRoundStart
  - onThrow
  - onMiss
  - onRoundEnd

---

⚙️ Configurable Settings

### Base Rules
- Immunity toggle
- Killer stays permanent
- Exact zero elimination
- Recovery before own turn

### Chaos Settings
- Enable/disable individual modifiers
- Weighted modifier spawning
- Apply modifier per turn OR per round

### UI / UX
- Multiple visual themes
- Dynamic modal system (intro + info popups)
- Contextual modifier descriptions (e.g. revived player, safe zone player)

---

🧱 Architecture

The project is structured in a modular way:

- `KillerGame` → core game logic
- `ChaosEngine` → modifier system & selection logic
- `Modifiers` → separate classes per modifier
- `UI layer` → rendering, modals, interactions
- `Settings system` → localStorage + per-mode configuration

---

🛠️ Tech Stack

- JavaScript (ES6 modules)
- HTML5
- CSS3

---

📌 Key Highlights

- Modular chaos modifier system
- Weighted random system for balanced gameplay
- Dynamic UI updates based on game state
- Strong separation of logic and UI
- Scalable architecture for future game modes

---

📈 Future Improvements

- Additional game modes (Drink Mode, Party Modes)
- Statistics system (wins, accuracy, history)
- Persistent storage (players & sessions)
- Animations & sound effects
- Mobile-first UI improvements
- Multiplayer / shared screen enhancements

---

👨‍💻 Author

Xander Van Malder  
Full Stack Developer (in training)

---

⚠️ Note

This project is part of a personal portfolio and focuses on:
- JavaScript architecture
- Game logic design
- Interactive UI systems