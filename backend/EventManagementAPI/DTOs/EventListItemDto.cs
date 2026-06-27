namespace EventManagementAPI.DTOs
{
    public class EventListItemDto
    {
        public int EventId { get; set; }
        public int CreatedByUserId { get; set; }
        public string CreatedByProfileName { get; set; } = string.Empty;
        public string CreatedByUsername { get; set; } = string.Empty;
        public string EventName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime EventDate { get; set; }
        public int Vacancy { get; set; }
        public int RemainingVacancy { get; set; }
        public bool IsCancelled { get; set; }
        public string ApprovalStatus { get; set; } = string.Empty;
        public DateTime? ApprovalRequestedAtUtc { get; set; }
        public DateTime? ApprovedAtUtc { get; set; }
        public bool IsBooked { get; set; }
        public int? BookingId { get; set; }
        public bool CanEdit { get; set; }
        public bool CanDelete { get; set; }
        public bool CanApprove { get; set; }
    }
}
