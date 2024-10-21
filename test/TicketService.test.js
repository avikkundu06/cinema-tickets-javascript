import TicketService from "../src/pairtest/TicketService.js";
import InvalidPurchaseException from "../src/pairtest/lib/InvalidPurchaseException.js";
import TicketPaymentService from "../src/thirdparty/paymentgateway/TicketPaymentService.js";
import SeatReservationService from "../src/thirdparty/seatbooking/SeatReservationService.js";

// Mocking the external services
jest.mock("../src/thirdparty/paymentgateway/TicketPaymentService");
jest.mock("../src/thirdparty/seatbooking/SeatReservationService");

describe("TicketService", () => {
  let ticketService;
  let ticketTypeRequestAdult, ticketTypeRequestChild, ticketTypeRequestInfant;

  beforeEach(() => {
    ticketService = new TicketService();

    ticketTypeRequestAdult = { getTicketType: () => "ADULT", getNoOfTickets: () => 2 };
    ticketTypeRequestChild = { getTicketType: () => "CHILD", getNoOfTickets: () => 1 };
    ticketTypeRequestInfant = { getTicketType: () => "INFANT", getNoOfTickets: () => 1 };
  });

  it("should purchase tickets successfully", () => {
    const accountId = 12345;

    ticketService.purchaseTickets(accountId, [ticketTypeRequestAdult, ticketTypeRequestChild, ticketTypeRequestInfant]);

    expect(TicketPaymentService.mock.instances[0].makePayment).toHaveBeenCalledWith(accountId, 65);
    expect(SeatReservationService.mock.instances[0].reserveSeat).toHaveBeenCalledWith(accountId, 3);
  });

  it("should throw an error for invalid account ID", () => {
    const invalidAccountId = 0;

    expect(() => {
      ticketService.purchaseTickets(invalidAccountId, [ticketTypeRequestAdult]);
    }).toThrow(InvalidPurchaseException);
  });

  it("should throw an error when no tickets are purchased", () => {
    const accountId = 12345;

    expect(() => {
      ticketService.purchaseTickets(accountId, []);
    }).toThrow(InvalidPurchaseException);
  });

  it("should throw an error when purchasing Child tickets without Adult", () => {
    const accountId = 12345;

    expect(() => {
      ticketService.purchaseTickets(accountId, [ticketTypeRequestChild]);
    }).toThrow(InvalidPurchaseException);
  });

  it("should throw an error when purchasing more Infants than Adults", () => {
    const accountId = 12345;
    const ticketTypeRequestMoreInfants = { getTicketType: () => "INFANT", getNoOfTickets: () => 3 };

    expect(() => {
      ticketService.purchaseTickets(accountId, [ticketTypeRequestAdult, ticketTypeRequestMoreInfants]);
    }).toThrow(InvalidPurchaseException);
  });

  it("should throw an error when exceeding the maximum number of tickets", () => {
    const accountId = 12345;
    const ticketTypeRequestTooManyAdults = { getTicketType: () => "ADULT", getNoOfTickets: () => 26 };

    expect(() => {
      ticketService.purchaseTickets(accountId, [ticketTypeRequestTooManyAdults]);
    }).toThrow(InvalidPurchaseException);
  });

  it("should call the payment service with the correct total price", () => {
    const accountId = 12345;

    ticketService.purchaseTickets(accountId, [ticketTypeRequestAdult, ticketTypeRequestChild]);

    expect(TicketPaymentService.mock.instances[0].makePayment).toHaveBeenCalledWith(accountId, 65);
  });

  it("should call the seat reservation service with the correct total seats", () => {
    const accountId = 12345;

    ticketService.purchaseTickets(accountId, [ticketTypeRequestAdult, ticketTypeRequestChild]);

    expect(SeatReservationService.mock.instances[0].reserveSeat).toHaveBeenCalledWith(accountId, 3);
  });
});
