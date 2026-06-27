namespace EventManagementAPI.DTOs
{
    public class UpdateProfileRequestDto
    {
        public string? ProfileName { get; set; }
        public string? Username { get; set; }
        public int? Age { get; set; }
        public string? Email { get; set; }
        public string? Contact { get; set; }
        public string? CurrentPassword { get; set; }
        public string? NewPassword { get; set; }
    }
}
