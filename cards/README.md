# Games

A collection of small browser-based games.

## Poker Squares

The current Poker Squares game is a puzzle variant of the traditional solitaire game. Each round begins with 25 cards already arranged in a 5 × 5 grid. The player may make three swaps, trying to improve the poker hands formed by the five rows and five columns.

Open `cards/index.html` in a browser to play.

### Current rules

- A shuffled 52-card deck supplies the 25 cards in the grid.
- Each row and column forms a five-card poker hand, for ten hands total.
- Select one card and then another to swap their positions.
- You may make three swaps per round.
- Hand labels update after every swap.
- Ace can be low in A–2–3–4–5 or high in 10–J–Q–K–A.

### Development priorities

1. Add scoring and a final result.
2. Highlight the consequences of a prospective swap.
3. Save high scores and perhaps show recent rounds.
4. Experiment with four or five swaps, because three may leave some deals feeling mostly predetermined.
5. Add richer visual styling or progression systems only after the core game feels complete.

## Traditional Poker Squares rules

Traditional Poker Squares, also called Poker Solitaire, begins with an empty 5 × 5 grid rather than a completed grid.

1. Shuffle a standard 52-card deck.
2. Turn over one card at a time.
3. Place each card into any empty square in the grid.
4. Once placed, a card cannot be moved.
5. Continue until 25 cards have been placed.
6. Score the five rows and five columns as ten separate five-card poker hands.
7. Add the ten hand values to determine the final score.

Only 25 of the 52 cards are used in a round. The main strategic decision is where to commit each card without knowing which cards will appear later.

Scoring systems vary. A common American point schedule is:

| Hand | Points |
| --- | ---: |
| Royal flush | 100 |
| Straight flush | 75 |
| Four of a kind | 50 |
| Full house | 25 |
| Flush | 20 |
| Straight | 15 |
| Three of a kind | 10 |
| Two pair | 5 |
| One pair | 2 |
| High card | 0 |

This traditional mode could later live alongside the current swap-based puzzle as a separate game mode.
