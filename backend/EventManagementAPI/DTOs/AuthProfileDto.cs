namespace EventManagementAPI.DTOs
{
    public class AuthProfileDto
    {
        public int UserId { get; set; }
        public string ProfileName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public int? Age { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Contact { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}
