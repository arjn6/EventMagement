using EventManagementAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace EventManagementAPI.Data
{
    public static class DbInitializer
    {
        public static async Task SeedAsync(AppDbContext context)
        {
            await context.Database.MigrateAsync();

            if (context.Users is null)
            {
                return;
            }

            var hasAnyUsers = await context.Users.AnyAsync();
            if (!hasAnyUsers)
            {
                context.Users.Add(new User
                {
                    ProfileName = "System Admin",
                    Username = "admin",
                    Password = BCrypt.Net.BCrypt.HashPassword("admin123"),
                    Email = "admin@eventhub.local",
                    Contact = "0000000000",
                    Role = "Admin"
                });

                context.Users.Add(new User
                {
                    ProfileName = "Default Organizer",
                    Username = "organizer",
                    Password = BCrypt.Net.BCrypt.HashPassword("organizer123"),
                    Email = "organizer@eventhub.local",
                    Contact = "1111111111",
                    Role = "Organizer"
                });

                context.Users.Add(new User
                {
                    ProfileName = "Default Attendee",
                    Username = "attendee",
                    Password = BCrypt.Net.BCrypt.HashPassword("attendee123"),
                    Email = "attendee@eventhub.local",
                    Contact = "2222222222",
                    Role = "Attendee"
                });

                await context.SaveChangesAsync();
            }

            if (context.Events is not null)
            {
                var hasEvents = await context.Events.AnyAsync();
                if (!hasEvents)
                {
                    var adminUserId = await context.Users
                        .Where(user => user.Role == "Admin")
                        .Select(user => user.UserId)
                        .FirstAsync();

                    context.Events.AddRange(
                        new Event
                        {
                            CreatedByUserId = adminUserId,
                            EventName = "Tech Meetup",
                            Description = "Monthly networking and tech talks.",
                            EventDate = DateTime.UtcNow.AddDays(10),
                            Vacancy = 50,
                            IsCancelled = false,
                            IsDeleted = false,
                            ApprovalStatus = "Approved",
                            ApprovedAtUtc = DateTime.UtcNow
                        },
                        new Event
                        {
                            CreatedByUserId = adminUserId,
                            EventName = "Product Workshop",
                            Description = "Hands-on workshop for product teams.",
                            EventDate = DateTime.UtcNow.AddDays(20),
                            Vacancy = 30,
                            IsCancelled = false,
                            IsDeleted = false,
                            ApprovalStatus = "Approved",
                            ApprovedAtUtc = DateTime.UtcNow
                        }
                    );

                    await context.SaveChangesAsync();
                }
            }
        }

    }
}
