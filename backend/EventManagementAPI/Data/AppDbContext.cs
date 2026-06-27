using Microsoft.EntityFrameworkCore;
using EventManagementAPI.Models;

namespace EventManagementAPI.Data
{
    public class AppDbContext : DbContext
    {
        // Constructor
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        // Tables
        public DbSet<User>? Users { get; set; }
        public DbSet<Event>? Events { get; set; }
        public DbSet<Booking>? Bookings { get; set; }
        public DbSet<Ticket>? Tickets { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>()
                .HasIndex(user => user.Username)
                .IsUnique();

            modelBuilder.Entity<Event>()
                .HasOne(eventItem => eventItem.CreatedByUser)
                .WithMany()
                .HasForeignKey(eventItem => eventItem.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}