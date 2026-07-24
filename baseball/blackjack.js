// Reusable blackjack helpers retained for possible future game modes.
(function exposeBlackjack(global) {
  function cardValue(card) {
    if (card.rank === "A") return 11;
    if (["J", "Q", "K", "Joker"].includes(card.rank)) return 10;
    return Number(card.rank);
  }

  function total(hand) {
    let value = hand.reduce((sum, card) => sum + cardValue(card), 0);
    let aces = hand.filter((card) => card.rank === "A").length;
    while (value > 21 && aces > 0) {
      value -= 10;
      aces -= 1;
    }
    return value;
  }

  function isNatural(hand) {
    return hand.length === 2 && total(hand) === 21;
  }

  function playDealerHand(deck, drawCard, standOn = 17) {
    const hand = [drawCard(deck), drawCard(deck)].filter(Boolean);
    while (total(hand) < standOn) hand.push(drawCard(deck));
    return hand;
  }

  global.Blackjack = { cardValue, total, isNatural, playDealerHand };
})(window);
