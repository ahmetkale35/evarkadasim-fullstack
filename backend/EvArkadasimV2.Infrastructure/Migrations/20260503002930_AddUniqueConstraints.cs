using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EvArkadasimV2.Infrastructure.Migrations
{
    public partial class AddUniqueConstraints : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserSwipes_SenderId",
                table: "UserSwipes");

            migrationBuilder.CreateIndex(
                name: "IX_UserSwipes_SenderId_ReceiverId",
                table: "UserSwipes",
                columns: new[] { "SenderId", "ReceiverId" },
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserSwipes_SenderId_ReceiverId",
                table: "UserSwipes");

            migrationBuilder.CreateIndex(
                name: "IX_UserSwipes_SenderId",
                table: "UserSwipes",
                column: "SenderId");
        }
    }
}
