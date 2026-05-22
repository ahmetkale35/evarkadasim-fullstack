using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EvArkadasimV2.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_UserProfiles_Location_City",
                table: "UserProfiles",
                column: "Location_City");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserProfiles_Location_City",
                table: "UserProfiles");
        }
    }
}
