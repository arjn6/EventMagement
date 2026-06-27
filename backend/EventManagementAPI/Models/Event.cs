
namespace EventManagementAPI.Models
{
    public class Event
    {
        public int EventId { get; set; }
        public int CreatedByUserId { get; set; }
        public string EventName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime EventDate { get; set; }
        public int Vacancy { get; set; }
        public bool IsCancelled { get; set; }
        public bool IsDeleted { get; set; }
        public string ApprovalStatus { get; set; } = "Approved";
        public DateTime? ApprovalRequestedAtUtc { get; set; }
        public DateTime? ApprovedAtUtc { get; set; }

        public User? CreatedByUser { get; set; }
    }
}
