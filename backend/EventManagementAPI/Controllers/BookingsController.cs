using EventManagementAPI.Data;
using EventManagementAPI.DTOs;
using EventManagementAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EventManagementAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BookingsController : ControllerBase
    {
        private readonly AppDbContext _dbContext;

        public BookingsController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            if (_dbContext.Bookings is null)
            {
                return Ok(Array.Empty<Booking>());
            }

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin");

            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var query = _dbContext.Bookings.Include(b => b.Event).Include(b => b.User).AsQueryable();
            if (!isAdmin)
            {
                query = query.Where(b => b.UserId == userId);
            }

            var bookings = await query.ToListAsync();
            return Ok(bookings);
        }

        [HttpGet("history")]
        public async Task<IActionResult> History()
        {
            return await GetAll();
        }

        [HttpGet("summary")]
        public async Task<IActionResult> Summary()
        {
            if (_dbContext.Bookings is null)
            {
                return Ok(new BookingSummaryDto());
            }

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin");
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var query = _dbContext.Bookings.AsQueryable();
            if (!isAdmin)
            {
                query = query.Where(b => b.UserId == userId);
            }

            var totalBookings = await query.CountAsync();
            var distinctEvents = await query.Select(b => b.EventId).Distinct().CountAsync();

            return Ok(new BookingSummaryDto
            {
                TotalBookings = totalBookings,
                DistinctEvents = distinctEvents
            });
        }

        [HttpPost]
        [Authorize(Roles = "Attendee")]
        public async Task<IActionResult> Create([FromBody] CreateBookingRequestDto request)
        {
            if (_dbContext.Bookings is null || _dbContext.Events is null)
            {
                return Problem("Bookings or Events table is unavailable.");
            }

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var eventExists = await _dbContext.Events.AnyAsync(e => e.EventId == request.EventId && !e.IsDeleted);
            if (!eventExists)
            {
                return BadRequest(new { Message = "Event not found." });
            }

            var eventItem = await _dbContext.Events.FirstAsync(e => e.EventId == request.EventId);
            if (eventItem.ApprovalStatus != "Approved")
            {
                return Conflict(new { Message = "This event is not published yet." });
            }

            if (eventItem.IsCancelled)
            {
                return Conflict(new { Message = "This event is cancelled." });
            }

            var bookedCount = await _dbContext.Bookings.CountAsync(b => b.EventId == request.EventId);
            if (bookedCount >= eventItem.Vacancy)
            {
                return Conflict(new { Message = "No vacancy left for this event." });
            }

            var alreadyBooked = await _dbContext.Bookings.AnyAsync(b => b.UserId == userId && b.EventId == request.EventId);
            if (alreadyBooked)
            {
                return Conflict(new { Message = "You already booked this event." });
            }

            var booking = new Booking
            {
                UserId = userId,
                EventId = request.EventId
            };

            _dbContext.Bookings.Add(booking);
            await _dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAll), new { id = booking.BookingId }, booking);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> CancelBooking(int id)
        {
            if (_dbContext.Bookings is null)
            {
                return NotFound();
            }

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin");
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var booking = await _dbContext.Bookings.FirstOrDefaultAsync(b => b.BookingId == id);
            if (booking is null)
            {
                return NotFound();
            }

            if (!isAdmin && booking.UserId != userId)
            {
                return Forbid();
            }

            _dbContext.Bookings.Remove(booking);
            await _dbContext.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("event/{eventId:int}")]
        [Authorize(Roles = "Admin,Organizer")]
        public async Task<IActionResult> GetByEvent(int eventId)
        {
            if (_dbContext.Bookings is null || _dbContext.Events is null)
            {
                return Ok(Array.Empty<EventBookingItemDto>());
            }

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin");
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var ev = await _dbContext.Events
                .FirstOrDefaultAsync(e => e.EventId == eventId && !e.IsDeleted);
            if (ev is null)
            {
                return NotFound(new { Message = "Event not found." });
            }

            if (!isAdmin && ev.CreatedByUserId != userId)
            {
                return Forbid();
            }

            var bookings = await _dbContext.Bookings
                .Include(b => b.User)
                .Where(b => b.EventId == eventId)
                .Select(b => new EventBookingItemDto
                {
                    BookingId = b.BookingId,
                    UserId = b.UserId,
                    Username = b.User != null ? b.User.Username : string.Empty,
                    ProfileName = b.User != null ? (b.User.ProfileName ?? b.User.Username) : string.Empty,
                    Email = b.User != null ? b.User.Email : null,
                    Contact = b.User != null ? b.User.Contact : null
                })
                .ToListAsync();

            return Ok(bookings);
        }
    }
}
