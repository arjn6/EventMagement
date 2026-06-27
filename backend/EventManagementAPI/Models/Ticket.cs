namespace EventManagementAPI.Models
{
    public class Ticket{
        
        public int TicketId { get; set; }
        public int EventId { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public int CreatedByUserId { get; set; }
        public int Quantity { get; set; }
        public bool IsActive { get; set; }
        public Event? Event { get; set; }
    }
}
