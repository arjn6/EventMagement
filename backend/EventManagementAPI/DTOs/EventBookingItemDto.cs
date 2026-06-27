namespace EventManagementAPI.DTOs
{
    public class EventBookingItemDto
    {
        public int BookingId { get; set; }
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string ProfileName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Contact { get; set; }
    }
}
