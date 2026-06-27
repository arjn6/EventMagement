using EventManagementAPI.DTOs;

namespace EventManagementAPI.Services
{
    public interface IAuthService
    {
        Task<LoginResponseDto?> LoginAsync(LoginRequestDto request);
        Task<LoginResponseDto?> RegisterAsync(RegisterRequestDto request);
        Task<AuthProfileDto?> CreateOrganizerAsync(CreateOrganizerRequestDto request);
        Task<AuthProfileDto?> GetProfileAsync(int userId);
        Task<AuthProfileDto?> UpdateProfileAsync(int userId, UpdateProfileRequestDto request);
    }
}
