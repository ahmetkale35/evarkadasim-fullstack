using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EvArkadasimV2.Infrastructure.Migrations
{
    public partial class AddDetailedCommunicationStyleColumn : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DetailedTestResults_DetailedCommunicationStyle",
                table: "UserProfiles",
                type: "TEXT",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DetailedTestResults_DetailedCommunicationStyle",
                table: "UserProfiles");
        }
    }
}
