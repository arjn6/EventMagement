using EventManagementAPI.Data;
using EventManagementAPI.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EventManagementAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _dbContext;

        public UsersController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            if (_dbContext.Users is null)
            {
                return Ok(Array.Empty<AuthProfileDto>());
            }

            var users = await _dbContext.Users
                .OrderBy(u => u.Username)
                .Select(u => new AuthProfileDto
                {
                    UserId = u.UserId,
                    ProfileName = u.ProfileName,
                    Username = u.Username,
                    Age = u.Age,
                    Email = u.Email,
                    Contact = u.Contact,
                    Role = u.Role
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpPut("{id:int}/role")]
        public async Task<IActionResult> UpdateRole(int id, [FromBody] UpdateUserRoleRequestDto request)
        {
            if (_dbContext.Users is null)
            {
                return NotFound();
            }

            var role = request.Role?.Trim();
            if (string.IsNullOrWhiteSpace(role) || (role != "Admin" && role != "Organizer" && role != "Attendee"))
            {
                return BadRequest(new { Message = "Role must be Admin, Organizer, or Attendee." });
            }

            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserId == id);
            if (user is null)
            {
                return NotFound();
            }

            user.Role = role;
            await _dbContext.SaveChangesAsync();

            return Ok(new AuthProfileDto
            {
                UserId = user.UserId,
                ProfileName = user.ProfileName,
                Username = user.Username,
                Age = user.Age,
                Email = user.Email,
                Contact = user.Contact,
                Role = user.Role
            });
        }
        
    }
}
