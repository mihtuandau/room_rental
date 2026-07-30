export function PrivacyPolicyContent() {
  return (
    <>
      <aside className="mt-8 rounded-lg border border-brand-100 bg-brand-50 p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-zinc-900">Tóm tắt chính</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-zinc-700">
          <li>Chỉ thu thập dữ liệu cần thiết để cung cấp và bảo vệ dịch vụ.</li>
          <li>
            Không bán dữ liệu cá nhân hoặc dùng dữ liệu cho quảng cáo theo dõi.
          </li>
          <li>
            Cookie hiện tại chỉ phục vụ đăng nhập, duy trì phiên và bảo mật tài
            khoản.
          </li>
        </ul>
      </aside>
      <article className="mt-10 space-y-10 text-sm leading-7 text-zinc-700">
        <PolicySection title="1. Dữ liệu được thu thập">
          <p>Tùy theo cách bạn sử dụng Trọ Ơi, dữ liệu có thể bao gồm:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong className="font-medium text-zinc-900">
                Dữ liệu tài khoản:
              </strong>{' '}
              họ tên, số điện thoại, email, ảnh đại diện và thông tin liên hệ.
              Nếu đăng nhập bằng Google, Trọ Ơi nhận mã định danh cùng thông
              tin hồ sơ mà bạn đồng ý chia sẻ.
            </li>
            <li>
              <strong className="font-medium text-zinc-900">
                Dữ liệu tin đăng:
              </strong>{' '}
              tiêu đề, mô tả, giá thuê, diện tích, địa chỉ, tọa độ, hình ảnh,
              tiện ích và thông tin liên hệ của chủ trọ.
            </li>
            <li>
              <strong className="font-medium text-zinc-900">
                Dữ liệu hoạt động:
              </strong>{' '}
              tin đã lưu, báo cáo, lượt xem, lượt liên hệ, thông báo và lịch sử
              duyệt tin.
            </li>
            <li>
              <strong className="font-medium text-zinc-900">
                Dữ liệu xác thực:
              </strong>{' '}
              cookie phiên đăng nhập và thông tin cần thiết để phát hiện, ngăn
              chặn truy cập trái phép.
            </li>
          </ul>
        </PolicySection>
        <PolicySection title="2. Mục đích sử dụng dữ liệu">
          <ul className="list-disc space-y-2 pl-5">
            <li>Tạo và quản lý tài khoản của bạn.</li>
            <li>Hiển thị, tìm kiếm và quản lý tin đăng cho thuê.</li>
            <li>Kết nối người thuê với chủ trọ theo yêu cầu của người dùng.</li>
            <li>Duyệt tin, xử lý báo cáo và phòng chống lừa đảo.</li>
            <li>
              Gửi thông báo liên quan đến trạng thái tin đăng và tài khoản.
            </li>
            <li>
              Bảo vệ hệ thống, khắc phục lỗi và cải thiện chất lượng dịch vụ.
            </li>
          </ul>
        </PolicySection>
        <PolicySection title="3. Cookie và lưu trữ trên trình duyệt">
          <p>
            Trọ Ơi sử dụng cookie <code>rr_session</code> và{' '}
            <code>rr_refresh</code> để duy trì trạng thái đăng nhập. Các cookie
            này được đặt ở chế độ <code>HttpOnly</code>, không thể đọc bằng
            JavaScript thông thường và chỉ được gửi trong phạm vi cần thiết.
          </p>
          <p className="mt-3">
            Lựa chọn giao diện sáng hoặc tối được lưu trên trình duyệt của bạn
            bằng bộ nhớ cục bộ. Trọ Ơi hiện không sử dụng cookie quảng cáo,
            Analytics hoặc Pixel để theo dõi hành vi.
          </p>
        </PolicySection>
        <PolicySection title="4. Chia sẻ dữ liệu với bên cung cấp dịch vụ">
          <p>
            Dữ liệu chỉ được chia sẻ trong phạm vi cần thiết để vận hành dịch
            vụ, bao gồm:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Google khi bạn chủ động chọn đăng nhập bằng Google.</li>
            <li>
              Cloudinary để tải lên và phân phối ảnh đại diện, ảnh tin đăng.
            </li>
            <li>
              Nhà cung cấp hạ tầng lưu trữ, cơ sở dữ liệu hoặc bảo mật được Trọ
              Ơi sử dụng để vận hành hệ thống.
            </li>
            <li>
              Cơ quan có thẩm quyền khi có yêu cầu hợp pháp hoặc khi cần bảo vệ
              quyền và sự an toàn của người dùng.
            </li>
          </ul>
          <p className="mt-3">
            Trọ Ơi không bán dữ liệu cá nhân và không chia sẻ dữ liệu cho mục
            đích quảng cáo theo dõi.
          </p>
        </PolicySection>
        <PolicySection title="5. Dữ liệu công khai trên tin đăng">
          <p>
            Khi đăng tin, một số nội dung như tiêu đề, mô tả, vị trí, hình ảnh,
            giá thuê và thông tin liên hệ có thể được hiển thị công khai. Bạn
            không nên đưa giấy tờ tùy thân, mật khẩu, thông tin tài chính hoặc
            dữ liệu nhạy cảm vào mô tả và hình ảnh tin đăng.
          </p>
        </PolicySection>
        <PolicySection title="6. Thời gian lưu trữ và bảo mật">
          <p>
            Dữ liệu được lưu trong thời gian cần thiết để cung cấp dịch vụ, đáp
            ứng nghĩa vụ pháp lý, giải quyết tranh chấp và ngăn chặn gian lận.
            Mật khẩu được lưu dưới dạng đã băm; token đăng nhập được bảo vệ bằng
            cookie bảo mật và có thể bị thu hồi khi đăng xuất.
          </p>
          <p className="mt-3">
            Không có hệ thống nào an toàn tuyệt đối. Trọ Ơi áp dụng các biện
            pháp kỹ thuật và quy trình phù hợp để hạn chế truy cập, thay đổi
            hoặc tiết lộ dữ liệu trái phép.
          </p>
        </PolicySection>
        <PolicySection title="7. Quyền của bạn">
          <p>Bạn có thể yêu cầu:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Xem và cập nhật thông tin tài khoản.</li>
            <li>
              Chỉnh sửa, ẩn hoặc xóa tin đăng thuộc quyền quản lý của mình.
            </li>
            <li>Được giải thích về việc thu thập và xử lý dữ liệu cá nhân.</li>
            <li>
              Rút lại sự đồng ý hoặc yêu cầu hạn chế, chỉnh sửa, xóa dữ liệu
              trong phạm vi pháp luật và nghĩa vụ lưu trữ cho phép.
            </li>
          </ul>
        </PolicySection>
        <PolicySection title="8. Thay đổi chính sách và liên hệ">
          <p>
            Chính sách có thể được cập nhật khi tính năng, nhà cung cấp dịch vụ
            hoặc quy định pháp luật thay đổi. Ngày cập nhật mới nhất luôn được
            hiển thị ở đầu trang.
          </p>
          <p className="mt-3">
            Nếu có câu hỏi hoặc muốn thực hiện quyền liên quan đến dữ liệu cá
            nhân, bạn có thể gửi yêu cầu qua kênh hỗ trợ chính thức được công
            bố trên Trọ Ơi. Danh tính có thể được xác minh trước khi xử lý yêu
            cầu để bảo vệ tài khoản của bạn.
          </p>
        </PolicySection>
      </article>
    </>
  );
}

function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
