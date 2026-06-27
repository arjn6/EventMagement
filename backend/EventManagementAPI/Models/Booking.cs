//using EventManagementAPI.Models;
namespace EventManagementAPI.Models
{
    public class Booking
    {
        public int BookingId { get; set; }
        public int UserId { get; set; }
        public int EventId { get; set; }

        public User? User { get; set; }
        public Event? Event { get; set; }
    }
}