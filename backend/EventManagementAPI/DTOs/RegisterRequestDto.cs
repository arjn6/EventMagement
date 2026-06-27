namespace EventManagementAPI.DTOs
{
    public class RegisterRequestDto
    {
        public string ProfileName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public int? Age { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Contact { get; set; } = string.Empty;
        public string Role { get; set; } = "User";
    }
}
