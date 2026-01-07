/**
 * js/admin-users.js
 */

const AdminUsers = {
  allUsers: [],

  init() {
    this.allUsers = UserManager.getUsers();
    this.renderTable(this.allUsers);
  },

  renderTable(users) {
    const tbody = document.getElementById("user-table-body");
    tbody.innerHTML = "";

    if (users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px;">Trống!</td></tr>`;
      return;
    }

    users.forEach((user) => {
      const isAdmin = user.role === "admin";
      const roleBadge = isAdmin
        ? `<span class="badge bg-admin">Admin</span>`
        : `<span class="badge bg-customer">Khách</span>`;

      let actionButtons = "";
      const currentUser = UserManager.getCurrentUser();

      if (currentUser && user.id === currentUser.id) {
        actionButtons = `<span style="color:#ccc; font-size:12px;">(Admin Online)</span>`;
      } else {
        // ĐÃ THÊM LẠI NÚT ĐỔI QUYỀN VÀO ĐÂY
        actionButtons = `
                    <button class="btn-action btn-edit" title="Sửa" onclick="AdminUsers.openEditModal(${user.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-role" title="Đổi quyền" onclick="AdminUsers.changeRole(${user.id}, '${user.username}', '${user.role}')">
                        <i class="fas fa-user-shield"></i>
                    </button>
                    <button class="btn-action btn-del" title="Xóa" onclick="AdminUsers.deleteUser(${user.id}, '${user.username}')">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
      }

      const row = `
                <tr>
                    <td>${user.id}</td>
                    <td><strong>${user.fullName}</strong></td>
                    <td>${user.username}</td>
                    <td>${user.password}</td> <td>${user.phone}</td>
                    <td>${roleBadge}</td>
                    <td style="text-align: center;">${actionButtons}</td>
                </tr>
            `;
      tbody.innerHTML += row;
    });
  },

  handleSearch() {
    const keyword = document.getElementById("search-input").value.toLowerCase();
    const filtered = this.allUsers.filter(
      (u) =>
        u.fullName.toLowerCase().includes(keyword) ||
        u.username.toLowerCase().includes(keyword) ||
        u.phone.includes(keyword)
    );
    this.renderTable(filtered);
  },

  // --- MỞ MODAL SỬA ---
  openEditModal(id) {
    const user = this.allUsers.find((u) => u.id === id);
    if (!user) return;

    document.getElementById("edit-id").value = user.id;
    document.getElementById("edit-username").value = user.username;
    document.getElementById("edit-fullname").value = user.fullName;
    document.getElementById("edit-phone").value = user.phone;
    document.getElementById("edit-password").value = user.password; // Hiện pass cũ

    document.getElementById("editModal").style.display = "flex";
  },

  closeModal() {
    document.getElementById("editModal").style.display = "none";
  },

  // --- LƯU THÔNG TIN ---
  saveEdit() {
    const id = parseInt(document.getElementById("edit-id").value);
    const newName = document.getElementById("edit-fullname").value;
    const newPhone = document.getElementById("edit-phone").value;
    const newPass = document.getElementById("edit-password").value;

    if (!newName || !newPhone || !newPass) {
      alert("Vui lòng nhập đủ thông tin!");
      return;
    }

    const index = this.allUsers.findIndex((u) => u.id === id);
    if (index !== -1) {
      this.allUsers[index].fullName = newName;
      this.allUsers[index].phone = newPhone;
      this.allUsers[index].password = newPass; // Lưu đè pass

      localStorage.setItem("clean_fruit_users", JSON.stringify(this.allUsers));

      alert("Đã cập nhật thành công!");
      this.closeModal();
      this.renderTable(this.allUsers);
    }
  },

  // --- ĐỔI QUYỀN (HÀM NÀY ĐÃ ĐƯỢC PHỤC HỒI) ---
  changeRole(id, name, currentRole) {
    const newRole = currentRole === "admin" ? "customer" : "admin";
    const roleName = newRole === "admin" ? "Đại Ca (Admin)" : "Khách hàng";

    if (confirm(`Đổi quyền "${name}" thành ${roleName}?`)) {
      const index = this.allUsers.findIndex((u) => u.id === id);
      if (index !== -1) {
        this.allUsers[index].role = newRole;
        localStorage.setItem(
          "clean_fruit_users",
          JSON.stringify(this.allUsers)
        );
        this.renderTable(this.allUsers); // Load lại bảng ngay
      }
    }
  },

  // --- XÓA USER ---
  deleteUser(id, name) {
    if (confirm(`Chắc chắn xóa "${name}"?`)) {
      const result = UserManager.deleteUser(id);
      if (result.success) {
        this.allUsers = UserManager.getUsers();
        this.renderTable(this.allUsers);
      } else {
        alert(result.message);
      }
    }
  },
};

document.addEventListener("DOMContentLoaded", () => {
  AdminUsers.init();
});
function searchUsers() {
  AdminUsers.handleSearch();
}
