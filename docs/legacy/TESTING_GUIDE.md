# 🧪 Testing Guide - Impostor Game

## Prerequisites

✅ **Backend Running:** <http://localhost:3001>
✅ **Frontend Running:** <http://localhost:5173>
✅ **MongoDB Running:** localhost:27017
⚠️ **Redis:** Optional (in-memory fallback enabled)

---

## Quick Start Testing

### 1. Open the Application

Navigate to: **<http://localhost:5173>**

---

## Test Scenario 1: Single User Journey (5 minutes)

### Step 1: User Registration & Login

1. Click **"Register"** or navigate to registration page
2. Fill in:
   - Username: `testuser1`
   - Email: `test1@example.com`
   - Password: `password123`
3. Click **"Register"**
4. ✅ Expected: Automatic login and redirect to lobby/home

**Test Login:**

1. Logout if logged in
2. Click **"Login"**
3. Enter credentials
4. ✅ Expected: Redirect to lobby with user info displayed

---

### Step 2: Room Creation

1. Click **"Create Room"** button
2. Configure room settings:
   - Room Name: `Test Room 1`
   - Max Players: `6`
   - Min Players: `3`
   - Number of Impostors: `1`
   - Private: `false` (unchecked)
3. Click **"Create"**
4. ✅ Expected:
   - Room created successfully
   - Room code displayed (6 characters)
   - You are shown as the host
   - Status: "Waiting for players"

---

### Step 3: Browse Rooms

1. Navigate back to lobby (if in room, leave first)
2. Click **"Browse Rooms"** or **"Available Rooms"**
3. ✅ Expected:
   - List of public rooms displayed
   - Your created room appears in the list
   - Shows player count (1/6)
   - Shows host name

---

## Test Scenario 2: Multiplayer Game Flow (10 minutes)

**You'll need 3+ browser tabs/windows for this test**.

### Setup (Open 3 Browser Tabs)

**Tab 1 (Host):** <http://localhost:5173>
**Tab 2 (Player 2):** <http://localhost:5173> (use incognito/private mode)
**Tab 3 (Player 3):** <http://localhost:5173> (use another incognito window)

---

### Step 1: Register Multiple Users

**Tab 1:**

- Register as: `player1@test.com` / `Player1` / `pass123`

**Tab 2:**

- Register as: `player2@test.com` / `Player2` / `pass123`

**Tab 3:**

- Register as: `player3@test.com` / `Player3` / `pass123`

---

### Step 2: Create and Join Room

**Tab 1 (Host):**

1. Create a room: "Multiplayer Test"
2. Note the room code (e.g., `abc123`)
3. Wait for players to join

**Tab 2 (Player 2):**

1. Click **"Join by Code"**
2. Enter the room code
3. Click **"Join"**
4. ✅ Expected: Successfully joined, see other players

**Tab 3 (Player 3):**

1. Click **"Browse Rooms"**
2. Find "Multiplayer Test" room
3. Click **"Join"**
4. ✅ Expected: Successfully joined

**Verify in Tab 1:**

- All 3 players listed
- You are marked as host
- "Start Game" button enabled

---

### Step 3: Start Game

**Tab 1 (Host):**

1. Click **"Start Game"**
2. ✅ Expected: Game transitions to "Roles" phase

**All Tabs:**

- Each player sees their role:
  - 2 players see: **"You are a CITIZEN"** + secret word (e.g., "pizza")
  - 1 player sees: **"You are the IMPOSTOR"** (no word shown)
- Click **"Confirm Role"** button

✅ Expected: After all confirm, game moves to "Clues" phase

---

### Step 4: Submit Clues

**Citizens (2 players):**

- Think of a one-word clue related to the secret word
- Example for "pizza": enter "cheese" or "italian"
- Click **"Submit Clue"**

**Impostor (1 player):**

- Try to blend in without knowing the word
- Enter a generic clue like "food" or "delicious"
- Click **"Submit Clue"**

✅ Expected:

- After all clues submitted, see list of all clues
- Game moves to "Voting" phase

---

### Step 5: Vote for Impostor

**All Players:**

1. Review the clues from all players
2. Click on the player you suspect is the impostor
3. Click **"Submit Vote"**

✅ Expected:

- After all votes submitted, game moves to "Results" phase
- Shows voting results (who voted for whom)
- Shows eliminated player
- Reveals if eliminated player was impostor or citizen

---

### Step 6: Victory or Continue

**If impostor was eliminated:**

- ✅ Game shows: **"Citizens Win!"**
- Game ends

**If citizen was eliminated:**

- Game continues to next round
- Click **"Continue to Next Round"**
- Return to "Clues" phase with remaining players

**If voting tie:**

- Random player from tied players is eliminated
- Game continues

---

## Test Scenario 3: Edge Cases (5 minutes)

### Test: Player Disconnection

1. Start a game with 3+ players
2. During "Clues" phase, close one player's tab
3. ✅ Expected:
   - Other players notified of disconnection
   - Game continues with remaining players
   - Disconnected player can rejoin later

### Test: Host Leaving

1. Create room with 3+ players
2. Host leaves the room
3. ✅ Expected:
   - Host role transferred to another player
   - Game continues normally

### Test: Invalid Clue

1. Try to submit the secret word as your clue
2. ✅ Expected: Error message "Cannot use secret word as clue"

3. Try to submit same clue as another player
4. ✅ Expected: Error message "Clue already used"

### Test: Self-Voting

1. During voting phase, try to vote for yourself
2. ✅ Expected: Error message "Cannot vote for yourself"

---

## Test Scenario 4: Room Management (3 minutes)

### Test: Private Room

1. Create a private room (check "Private" option)
2. Verify room doesn't appear in "Browse Rooms"
3. Join using room code from another tab
4. ✅ Expected: Can only join via code, not from room list

### Test: Room Capacity

1. Create room with max 3 players
2. Have 3 players join
3. Try to join with 4th player
4. ✅ Expected: Error "Room is full"

### Test: Minimum Players

1. Create room with min 3 players
2. Try to start game with only 2 players
3. ✅ Expected: Error "Need at least 3 players"

---

## Expected WebSocket Events Flow

### 1. Authentication

```-
Client → Server: auth:register / auth:login
Server → Client: auth:register:success / auth:login:success
```

### 2. Room Creation/Joining

```-
Client → Server: room:create
Server → Client: room:created { room }

Client → Server: room:join { roomId }
Server → All in Room: room:playerJoined { room }
Server → Client: room:joined { room }
```

### 3. Game Start

```-
Client (Host) → Server: game:start { roomId }
Server → All: game:started { gameState }
Server → Each Player: game:role { isImpostor, secretWord }
```

### 4. Role Confirmation

```-
Client → Server: game:confirmRole { roomId }
Server → All: game:phaseChanged { phase: 'clues' }
```

### 5. Clue Submission

```-
Client → Server: game:submitClue { roomId, clue }
Server → All: game:clueSubmitted { gameState, playerId }
Server → All: game:phaseChanged { phase: 'voting' } (when all submitted)
```

### 6. Voting

```-
Client → Server: game:submitVote { roomId, votedPlayerId }
Server → All: game:voteSubmitted { gameState, voterId }
Server → All: game:phaseChanged { phase: 'results' | 'victory' }
```

---

## Troubleshooting

### Backend Not Responding

```bash
# Check if backend is running
netstat -ano | findstr :3001

# Restart backend
cd backend-new
npm run start:dev
```

### Frontend Not Loading

```bash
# Check if frontend is running
netstat -ano | findstr :5173

# Restart frontend
cd frontend-new
npm run dev
```

### MongoDB Connection Error

```bash
# Start MongoDB
mongod --dbpath C:\data\db

# Or use MongoDB service
net start MongoDB
```

### Redis Warnings (Safe to Ignore)

- In-memory fallback is enabled
- Game state persists in application memory
- Only lost on server restart

---

## Success Criteria

✅ All 3 players can register and login
✅ Room creation and joining works
✅ Game starts and roles are assigned correctly
✅ All phases execute in order (roles → clues → voting → results)
✅ Clues are validated (no duplicates, no secret word)
✅ Voting works and eliminates correct player
✅ Victory conditions detect correctly
✅ WebSocket events fire in real-time across all clients
✅ Player disconnection handled gracefully
✅ Multi-round games work correctly

---

## Performance Benchmarks

- **Initial Page Load:** < 2 seconds
- **Socket Connection:** < 500ms
- **Room Join:** < 1 second
- **Phase Transitions:** Instant (< 100ms)
- **Concurrent Players:** Tested up to 12 players per room

---

## Next Steps After Testing

1. ✅ Verify all features work as expected
2. 📸 Take screenshots of successful game completion
3. 🐛 Report any bugs found
4. 🚀 Deploy to production environment
5. 📊 Add analytics/monitoring
6. 🎨 UI/UX improvements based on testing feedback

---

**Happy Testing! 🎮**.
