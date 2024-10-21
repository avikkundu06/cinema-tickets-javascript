import InvalidPurchaseException from "./lib/InvalidPurchaseException.js";
import TicketPaymentService from "../thirdparty/paymentgateway/TicketPaymentService.js";
import SeatReservationService from "../thirdparty/seatbooking/SeatReservationService.js";

const TICKET_PRICES = {
  INFANT: 0,
  CHILD: 15,
  ADULT: 25,
};

const MAX_TICKETS = 25;

export default class TicketService {
  #totalPrice = 0;
  #ticketCounts = {
    ADULT: 0,
    CHILD: 0,
    INFANT: 0,
  };

  #getTicketTypeDistribution = (ticketTypeRequests) => {
    ticketTypeRequests.forEach((req) => {
      this.#ticketCounts[req.getTicketType()] += req.getNoOfTickets();
    });
  };

  #validateAccountId = (accountId) => {
    if (accountId <= 0) {
      throw new InvalidPurchaseException("Invalid account ID.");
    }
  };

  #validateTicketCounts = () => {
    const { ADULT, CHILD, INFANT } = this.#ticketCounts;
    const totalTickets = ADULT + CHILD;

    if (totalTickets < 1) {
      throw new InvalidPurchaseException("You must purchase at least one ticket.");
    }

    if (totalTickets > MAX_TICKETS) {
      throw new InvalidPurchaseException(`You can purchase between 1 and ${MAX_TICKETS} tickets.`);
    }

    if (CHILD > 0 && ADULT < 1) {
      throw new InvalidPurchaseException("You must purchase at least one Adult ticket with Child tickets.");
    }

    if (INFANT > ADULT) {
      throw new InvalidPurchaseException("You must purchase an Adult ticket for each Infant.");
    }
  };

  #calculateTotalPrice = () => {
    const { ADULT, CHILD } = this.#ticketCounts;
    this.#totalPrice = TICKET_PRICES.ADULT * ADULT + TICKET_PRICES.CHILD * CHILD;
  };

  #processPayment = (accountId) => {
    const paymentService = new TicketPaymentService();
    paymentService.makePayment(accountId, this.#totalPrice);
  };

  #reserveSeats = (accountId) => {
    const { ADULT, CHILD } = this.#ticketCounts;
    const totalSeats = ADULT + CHILD;
    const seatReservationService = new SeatReservationService();
    seatReservationService.reserveSeat(accountId, totalSeats);
  };

  purchaseTickets = (accountId, ticketTypeRequests) => {
    this.#getTicketTypeDistribution(ticketTypeRequests);
    this.#validateAccountId(accountId);
    this.#validateTicketCounts();
    this.#calculateTotalPrice();
    this.#processPayment(accountId);
    this.#reserveSeats(accountId);

    return {
      message: "Tickets purchased successfully!",
      accountId,
      ticketDetails: ticketTypeRequests.map((req) => ({
        type: req.getTicketType(),
        number: req.getNoOfTickets(),
      })),
    };
  };
}
