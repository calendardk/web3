/**
 * js/user-manager.js
 * Quản lý toàn bộ dữ liệu người dùng (Admin & Khách) & Tự động cập nhật Header
 * Đã bổ sung: Đổi mật khẩu & Cập nhật thông tin (Code cũ giữ nguyên)
 */

const USER_STORAGE_KEY = "clean_fruit_users";
const CURRENT_USER_KEY = "current_user";

const UserManager = {
  // 1. Khởi tạo dữ liệu mẫu
  init() {
    const storedUsers = localStorage.getItem(USER_STORAGE_KEY);
    if (!storedUsers) {
      const defaultUsers = [
        {
          id: 1,
          username: "admin",
          password: "123",
          fullName: "Lịch Đại Ca",
          phone: "0988888888",
          role: "admin",
        },
        {
          id: 2,
          username: "khach",
          password: "123",
          fullName: "Khách Mua Hàng",
          phone: "0912345678",
          role: "customer",
        },
      ];
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(defaultUsers));
      console.log("Đã tạo tài khoản mẫu: admin/123");
    }
  },

  // 2. Lấy danh sách user
  getUsers() {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  // 3. Xử lý Đăng Nhập
  login(username, password) {
    const users = this.getUsers();
    const user = users.find(
      (u) => u.username === username && u.password === password
    );

    if (user) {
      const sessionUser = { ...user };
      delete sessionUser.password;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
      return { success: true, user: sessionUser };
    }
    return { success: false, message: "Sai tên đăng nhập hoặc mật khẩu!" };
  },

  // 4. Xử lý Đăng Ký
  register(newUser) {
    const users = this.getUsers();
    if (users.some((u) => u.username === newUser.username)) {
      return { success: false, message: "Tên đăng nhập này đã có người dùng!" };
    }

    const userToAdd = {
      id: Date.now(),
      username: newUser.username,
      password: newUser.password,
      fullName: newUser.fullName,
      phone: newUser.phone,
      role: "customer",
    };

    users.push(userToAdd);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
    return { success: true, message: "Đăng ký thành công!" };
  },

  // 5. Lấy thông tin người đang đăng nhập
  getCurrentUser() {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  // 6. Đăng xuất
  logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
    window.location.href = "auth.html";
  },

  // 7. Kiểm tra quyền Admin
  checkAdminAccess() {
    const user = this.getCurrentUser();
    if (!user || user.role !== "admin") {
      alert("Khu vực cấm! Chỉ dành cho Admin.");
      window.location.href = "index.html";
      return false;
    }
    return true;
  },

  /* --- PHẦN MỚI THÊM VÀO (KHÔNG ẢNH HƯỞNG CODE CŨ) --- */

  // 8. Đổi mật khẩu
  changePassword(oldPass, newPass) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: "Bạn chưa đăng nhập!" };

    const users = this.getUsers();
    // Tìm user trong danh sách gốc
    const index = users.findIndex((u) => u.username === currentUser.username);

    if (index !== -1) {
      // Kiểm tra pass cũ
      if (users[index].password !== oldPass) {
        return { success: false, message: "Mật khẩu cũ không đúng!" };
      }
      // Lưu pass mới
      users[index].password = newPass;
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
      return { success: true, message: "Đổi mật khẩu thành công!" };
    }
    return { success: false, message: "Lỗi hệ thống!" };
  },

  // 9. Cập nhật thông tin (CÓ CHECK MẬT KHẨU)
  updateProfile(newFullName, newPhone, confirmPassword) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: "Bạn chưa đăng nhập!" };

    const users = this.getUsers();
    // Tìm user gốc trong database
    const index = users.findIndex((u) => u.username === currentUser.username);

    if (index !== -1) {
      // --- ĐOẠN NÀY QUAN TRỌNG NHẤT: CHECK PASS ---
      if (users[index].password !== confirmPassword) {
        return {
          success: false,
          message: "Mật khẩu xác nhận không đúng! Không cho sửa!",
        };
      }

      // Nếu pass đúng thì mới cho cập nhật
      users[index].fullName = newFullName;
      users[index].phone = newPhone;
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));

      // Cập nhật session hiện tại
      currentUser.fullName = newFullName;
      currentUser.phone = newPhone;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));

      return { success: true, message: "Cập nhật thông tin thành công!" };
    }
    return { success: false, message: "Lỗi hệ thống!" };
  },
};

// Khởi tạo ngay khi file được load
UserManager.init();

// ... (Các đoạn code bên trên giữ nguyên, chỉ thay đoạn cuối này thôi) ...

/* --- TỰ ĐỘNG CẬP NHẬT HEADER & TẠO LINK VÀO PROFILE --- */
document.addEventListener("DOMContentLoaded", () => {
  const currentUser = UserManager.getCurrentUser();

  // Nếu chưa đăng nhập thì thôi, không làm gì cả
  if (!currentUser) return;

  // 1. XỬ LÝ TRANG ADMIN (Tìm id="admin-name")
  // (Dành cho các file admin-*.html)
  const adminHeader = document.getElementById("admin-name");
  if (adminHeader) {
    // Biến dòng chữ "Chào, Admin" thành link bấm được
    adminHeader.innerHTML = `
        Chào, <a href="profile.html" style="color: inherit; text-decoration: none; font-weight: bold; border-bottom: 1px dashed currentColor;" title="Bấm để sửa thông tin">
            ${currentUser.fullName} <i class="fas fa-user-edit"></i>
        </a>
    `;
  }

  // 2. XỬ LÝ TRANG KHÁCH (Tìm id="user-account")
  // (Dành cho file index.html)
  const userHeader = document.getElementById("user-account");
  if (userHeader) {
    userHeader.innerHTML = `
        <div style="font-weight: bold; color: #4CAF50;">
            <a href="profile.html" style="text-decoration: none; color: inherit; display: flex; align-items: center; gap: 5px;">
                <i class="fas fa-user-circle"></i> Chào, ${currentUser.fullName}
            </a>
        </div>
        <div style="font-size: 13px; margin-top: 2px;">
            <a href="my-orders.html" style="color: #333; text-decoration: none;">📦 Đơn mua</a>
            <span style="margin:0 5px">|</span>
            <a href="#" onclick="UserManager.logout()" style="color: red; text-decoration: none;">Thoát</a>
        </div>
    `;

    // Cập nhật số lượng giỏ hàng (nếu đang ở trang có giỏ hàng)
    if (typeof CartManager !== "undefined") {
      setTimeout(() => CartManager.updateCountUI(), 100);
    }
  }
});
