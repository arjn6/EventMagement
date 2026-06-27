using EventManagementAPI.DTOs;
using EventManagementAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EventManagementAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            var result = await _authService.LoginAsync(request);

            if (result is null)
            {
                return Unauthorized(new { Message = "Invalid username or password." });
            }

            return Ok(result);
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
        {
            var result = await _authService.RegisterAsync(request);

            if (result is null)
            {
                return BadRequest(new { Message = "Registration failed. Only Attendee self-registration is allowed, or username already exists." });
            }

            return Ok(result);
        }

        [HttpPost("organizers")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateOrganizer([FromBody] CreateOrganizerRequestDto request)
        {
            var organizer = await _authService.CreateOrganizerAsync(request);
            if (organizer is null)
            {
                return BadRequest(new { Message = "Organizer creation failed. Username may already exist." });
            }

            return CreatedAtAction(nameof(Me), new { id = organizer.UserId }, organizer);
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var profile = await _authService.GetProfileAsync(userId);
            if (profile is null)
            {
                return NotFound();
            }

            return Ok(profile);
        }

        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequestDto request)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var profile = await _authService.UpdateProfileAsync(userId, request);
            if (profile is null)
            {
                return BadRequest(new { Message = "Profile update failed." });
            }

            return Ok(profile);
        }
    }
}
