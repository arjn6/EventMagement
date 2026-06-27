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
    public class EventsController : ControllerBase
    {
        private readonly AppDbContext _dbContext;

        public EventsController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll([FromQuery] string? search)
        {
            if (_dbContext.Events is null || _dbContext.Bookings is null || _dbContext.Users is null)
            {
                return Ok(Array.Empty<EventListItemDto>());
            }

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int? userId = int.TryParse(userIdClaim, out var parsedUserId) ? parsedUserId : null;
            var isAdmin = User.IsInRole("Admin");
            var isOrganizer = User.IsInRole("Organizer");

            var query = _dbContext.Events
                .Include(e => e.CreatedByUser)
                .Where(e => !e.IsDeleted)
                .AsQueryable();

            if (isAdmin)
            {
                query = query.OrderBy(e => e.ApprovalStatus).ThenBy(e => e.EventDate);
            }
            else if (isOrganizer && userId.HasValue)
            {
                query = query.Where(e => e.CreatedByUserId == userId.Value);
            }
            else
            {
                query = query.Where(e => e.ApprovalStatus == "Approved");
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(e =>
                    e.EventName.ToLower().Contains(term) ||
                    e.Description.ToLower().Contains(term));
            }

            var events = await query.ToListAsync();

            var userBookings = userId.HasValue
                ? await _dbContext.Bookings
                    .Where(b => b.UserId == userId.Value)
                    .ToDictionaryAsync(b => b.EventId, b => b.BookingId)
                : new Dictionary<int, int>();

            var bookedCounts = await _dbContext.Bookings
                .GroupBy(b => b.EventId)
                .Select(g => new { EventId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.EventId, x => x.Count);

            var result = events.Select(e =>
            {
                var bookedCount = bookedCounts.TryGetValue(e.EventId, out var count) ? count : 0;
                var remaining = Math.Max(0, e.Vacancy - bookedCount);
                var isBooked = userBookings.ContainsKey(e.EventId);

                return new EventListItemDto
                {
                    EventId = e.EventId,
                    CreatedByUserId = e.CreatedByUserId,
                    CreatedByProfileName = e.CreatedByUser?.ProfileName ?? string.Empty,
                    CreatedByUsername = e.CreatedByUser?.Username ?? string.Empty,
                    EventName = e.EventName,
                    Description = e.Description,
                    EventDate = e.EventDate,
                    Vacancy = e.Vacancy,
                    RemainingVacancy = remaining,
                    IsCancelled = e.IsCancelled,
                    ApprovalStatus = e.ApprovalStatus,
                    ApprovalRequestedAtUtc = e.ApprovalRequestedAtUtc,
                    ApprovedAtUtc = e.ApprovedAtUtc,
                    IsBooked = isBooked,
                    BookingId = isBooked ? userBookings[e.EventId] : null,
                    CanEdit = isAdmin || (isOrganizer && userId == e.CreatedByUserId),
                    CanDelete = isAdmin || (isOrganizer && userId == e.CreatedByUserId && e.ApprovalStatus != "DeletePending"),
                    CanApprove = isAdmin && (e.ApprovalStatus == "PendingApproval" || e.ApprovalStatus == "DeletePending")
                };
            });

            return Ok(result);
        }

        [HttpGet("approval-requests")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetApprovalRequests()
        {
            if (_dbContext.Events is null || _dbContext.Bookings is null || _dbContext.Users is null)
            {
                return Ok(Array.Empty<EventListItemDto>());
            }

            var result = await _dbContext.Events
                .Include(e => e.CreatedByUser)
                .Where(e => !e.IsDeleted)
                .OrderBy(e => e.ApprovalStatus == "PendingApproval" || e.ApprovalStatus == "DeletePending" ? 0 : 1)
                .ThenByDescending(e => e.ApprovalRequestedAtUtc ?? e.ApprovedAtUtc ?? e.EventDate)
                .Select(e => new EventListItemDto
                {
                    EventId = e.EventId,
                    CreatedByUserId = e.CreatedByUserId,
                    CreatedByProfileName = e.CreatedByUser != null ? e.CreatedByUser.ProfileName : string.Empty,
                    CreatedByUsername = e.CreatedByUser != null ? e.CreatedByUser.Username : string.Empty,
                    EventName = e.EventName,
                    Description = e.Description,
                    EventDate = e.EventDate,
                    Vacancy = e.Vacancy,
                    RemainingVacancy = Math.Max(0, e.Vacancy - _dbContext.Bookings.Count(b => b.EventId == e.EventId)),
                    IsCancelled = e.IsCancelled,
                    ApprovalStatus = e.ApprovalStatus,
                    ApprovalRequestedAtUtc = e.ApprovalRequestedAtUtc,
                    ApprovedAtUtc = e.ApprovedAtUtc,
                    CanApprove = e.ApprovalStatus == "PendingApproval" || e.ApprovalStatus == "DeletePending"
                })
                .ToListAsync();

            return Ok(result);
        }

        [HttpGet("{id:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(int id)
        {
            if (_dbContext.Events is null)
            {
                return NotFound();
            }

            var eventItem = await _dbContext.Events.FindAsync(id);
            return eventItem is null ? NotFound() : Ok(eventItem);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Organizer")]
        public async Task<IActionResult> Create([FromBody] EventUpsertRequestDto request)
        {
            if (_dbContext.Events is null)
            {
                return Problem("Events table is unavailable.");
            }

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var isAdmin = User.IsInRole("Admin");
            var approvalStatus = isAdmin ? "Approved" : "PendingApproval";

            var newEvent = new Event
            {
                CreatedByUserId = userId,
                EventName = request.EventName,
                Description = request.Description,
                EventDate = request.EventDate,
                Vacancy = Math.Max(0, request.Vacancy),
                IsCancelled = false,
                IsDeleted = false,
                ApprovalStatus = approvalStatus,
                ApprovalRequestedAtUtc = isAdmin ? null : DateTime.UtcNow,
                ApprovedAtUtc = isAdmin ? DateTime.UtcNow : null
            };

            _dbContext.Events.Add(newEvent);
            await _dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = newEvent.EventId }, newEvent);
        }

        [HttpPut("{id:int}")]
        [Authorize]
        public async Task<IActionResult> Update(int id, [FromBody] EventUpsertRequestDto request)
        {
            if (_dbContext.Events is null)
            {
                return NotFound();
            }

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var role = User.FindFirstValue(ClaimTypes.Role);
            var isAdmin = string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase);
            var isOrganizer = string.Equals(role, "Organizer", StringComparison.OrdinalIgnoreCase);

            if (!isAdmin && !isOrganizer)
            {
                return Forbid();
            }

            var eventItem = await _dbContext.Events.FindAsync(id);
            if (eventItem is null || eventItem.IsDeleted)
            {
                return NotFound();
            }

            if (isOrganizer && !isAdmin && eventItem.CreatedByUserId != userId)
            {
                return Forbid();
            }

            eventItem.EventName = request.EventName;
            eventItem.Description = request.Description;
            eventItem.EventDate = request.EventDate;
            eventItem.Vacancy = Math.Max(0, request.Vacancy);

            // Editing should not require approval; clear pending delete requests on edit.
            if (eventItem.ApprovalStatus == "DeletePending")
            {
                eventItem.ApprovalStatus = "Approved";
                eventItem.ApprovalRequestedAtUtc = null;
                eventItem.ApprovedAtUtc = DateTime.UtcNow;
            }

            await _dbContext.SaveChangesAsync();

            return Ok(eventItem);
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin,Organizer")]
        public async Task<IActionResult> Delete(int id)
        {
            if (_dbContext.Events is null)
            {
                return NotFound();
            }

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var eventItem = await _dbContext.Events.FindAsync(id);
            if (eventItem is null || eventItem.IsDeleted)
            {
                return NotFound();
            }

            if (User.IsInRole("Organizer"))
            {
                if (eventItem.CreatedByUserId != userId)
                {
                    return Forbid();
                }

                eventItem.ApprovalStatus = "DeletePending";
                eventItem.ApprovalRequestedAtUtc = DateTime.UtcNow;
                await _dbContext.SaveChangesAsync();

                return Ok(eventItem);
            }

            eventItem.IsDeleted = true;
            eventItem.ApprovalStatus = "Approved";
            eventItem.ApprovedAtUtc = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{id:int}/approve")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Approve(int id)
        {
            if (_dbContext.Events is null)
            {
                return NotFound();
            }

            var eventItem = await _dbContext.Events.FindAsync(id);
            if (eventItem is null || eventItem.IsDeleted)
            {
                return NotFound();
            }

            if (eventItem.ApprovalStatus == "DeletePending")
            {
                eventItem.IsDeleted = true;
            }

            eventItem.ApprovalStatus = "Approved";
            eventItem.ApprovalRequestedAtUtc = null;
            eventItem.ApprovedAtUtc = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();

            return Ok(eventItem);
        }

        [HttpPost("{id:int}/cancel")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CancelEvent(int id)
        {
            if (_dbContext.Events is null)
            {
                return NotFound();
            }

            var eventItem = await _dbContext.Events.FindAsync(id);
            if (eventItem is null || eventItem.IsDeleted)
            {
                return NotFound();
            }

            eventItem.IsCancelled = true;
            await _dbContext.SaveChangesAsync();

            return Ok(eventItem);
        }
    }
}
