using EventManagementAPI.Data;
using EventManagementAPI.DTOs;
using EventManagementAPI.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace EventManagementAPI.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _dbContext;
        private readonly IConfiguration _configuration;

        public AuthService(AppDbContext dbContext, IConfiguration configuration)
        {
            _dbContext = dbContext;
            _configuration = configuration;
        }

        public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            {
                return null;
            }

            if (_dbContext.Users is null)
            {
                return null;
            }

            var user = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Username == request.Username);

            if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
            {
                return null;
            }

            var token = GenerateJwtToken(user);
            if (token is null)
            {
                return null;
            }

            return token;
        }

        public async Task<LoginResponseDto?> RegisterAsync(RegisterRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            {
                return null;
            }

            if (_dbContext.Users is null)
            {
                return null;
            }

            var username = request.Username.Trim();
            var exists = await _dbContext.Users.AnyAsync(u => u.Username == username);
            if (exists)
            {
                return null;
            }

            var requestedRole = request.Role?.Trim();
            if (!string.IsNullOrWhiteSpace(requestedRole) && !string.Equals(requestedRole, "Attendee", StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            var user = new User
            {
                ProfileName = string.IsNullOrWhiteSpace(request.ProfileName) ? username : request.ProfileName.Trim(),
                Username = username,
                Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Age = request.Age,
                Email = request.Email.Trim(),
                Contact = request.Contact.Trim(),
                Role = "Attendee"
            };

            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            return GenerateJwtToken(user);
        }

        public async Task<AuthProfileDto?> CreateOrganizerAsync(CreateOrganizerRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            {
                return null;
            }

            if (_dbContext.Users is null)
            {
                return null;
            }

            var username = request.Username.Trim();
            var exists = await _dbContext.Users.AnyAsync(u => u.Username == username);
            if (exists)
            {
                return null;
            }

            var organizer = new User
            {
                ProfileName = string.IsNullOrWhiteSpace(request.ProfileName) ? username : request.ProfileName.Trim(),
                Username = username,
                Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Age = request.Age,
                Email = request.Email.Trim(),
                Contact = request.Contact.Trim(),
                Role = "Organizer"
            };

            _dbContext.Users.Add(organizer);
            await _dbContext.SaveChangesAsync();

            return new AuthProfileDto
            {
                UserId = organizer.UserId,
                ProfileName = organizer.ProfileName,
                Username = organizer.Username,
                Age = organizer.Age,
                Email = organizer.Email,
                Contact = organizer.Contact,
                Role = organizer.Role
            };
        }

        public async Task<AuthProfileDto?> GetProfileAsync(int userId)
        {
            if (_dbContext.Users is null)
            {
                return null;
            }

            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserId == userId);
            if (user is null)
            {
                return null;
            }

            return new AuthProfileDto
            {
                UserId = user.UserId,
                ProfileName = user.ProfileName,
                Username = user.Username,
                Age = user.Age,
                Email = user.Email,
                Contact = user.Contact,
                Role = user.Role
            };
        }

        public async Task<AuthProfileDto?> UpdateProfileAsync(int userId, UpdateProfileRequestDto request)
        {
            if (_dbContext.Users is null)
            {
                return null;
            }

            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserId == userId);
            if (user is null)
            {
                return null;
            }

            if (request.ProfileName is not null)
            {
                var profileName = request.ProfileName.Trim();
                user.ProfileName = string.IsNullOrWhiteSpace(profileName) ? user.Username : profileName;
            }

            if (!string.IsNullOrWhiteSpace(request.Username))
            {
                var newUsername = request.Username.Trim();
                var usernameTaken = await _dbContext.Users
                    .AnyAsync(u => u.UserId != userId && u.Username == newUsername);

                if (usernameTaken)
                {
                    return null;
                }

                user.Username = newUsername;
            }

            if (request.Age.HasValue)
            {
                user.Age = request.Age.Value;
            }

            if (request.Email is not null)
            {
                user.Email = request.Email.Trim();
            }

            if (request.Contact is not null)
            {
                user.Contact = request.Contact.Trim();
            }

            if (!string.IsNullOrWhiteSpace(request.NewPassword))
            {
                if (string.IsNullOrWhiteSpace(request.CurrentPassword))
                {
                    return null;
                }

                var validCurrentPassword = BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.Password);
                if (!validCurrentPassword)
                {
                    return null;
                }

                user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            }

            await _dbContext.SaveChangesAsync();

            return new AuthProfileDto
            {
                UserId = user.UserId,
                ProfileName = user.ProfileName,
                Username = user.Username,
                Age = user.Age,
                Email = user.Email,
                Contact = user.Contact,
                Role = user.Role
            };
        }

        private LoginResponseDto? GenerateJwtToken(User user)
        {
            var jwtSection = _configuration.GetSection("Jwt");
            var key = jwtSection["Key"];
            var issuer = jwtSection["Issuer"];
            var audience = jwtSection["Audience"];
            var expiresInMinutes = jwtSection.GetValue<int?>("ExpiresInMinutes") ?? 60;

            if (string.IsNullOrWhiteSpace(key) || string.IsNullOrWhiteSpace(issuer) || string.IsNullOrWhiteSpace(audience))
            {
                return null;
            }

            var expiresAtUtc = DateTime.UtcNow.AddMinutes(expiresInMinutes);

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new(ClaimTypes.Name, user.Username),
                new(ClaimTypes.Role, string.IsNullOrWhiteSpace(user.Role) ? "User" : user.Role)
            };

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var jwtToken = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: expiresAtUtc,
                signingCredentials: credentials);

            var tokenValue = new JwtSecurityTokenHandler().WriteToken(jwtToken);

            return new LoginResponseDto
            {
                Token = tokenValue,
                ExpiresAtUtc = expiresAtUtc,
                ProfileName = string.IsNullOrWhiteSpace(user.ProfileName) ? user.Username : user.ProfileName,
                Username = user.Username,
                Role = string.IsNullOrWhiteSpace(user.Role) ? "Attendee" : user.Role
            };
        }
    }
}
