namespace EventManagementAPI.DTOs
{
    public class EventUpsertRequestDto
    {
        public string EventName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime EventDate { get; set; }
        public int Vacancy { get; set; }
    }
}
