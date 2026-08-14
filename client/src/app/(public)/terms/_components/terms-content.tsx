export function TermsContent() {
  return (
    <>
      <aside className="mt-8 rounded-lg border border-brand-100 bg-brand-50 p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-zinc-900">Tóm tắt chính</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-zinc-700">
          <li>Trợ Ơi là nền tảng trung gian kết nối người cho thuê và người thuê phòng.</li>
          <li>Người đăng tin phải cung cấp thông tin chính xác, trung thực và hình ảnh thực tế.</li>
          <li>Nghiêm cấm mọi hành vi lừa đảo, đăng tin giả mạo hoặc trái pháp luật.</li>
          <li>Tất cả tin đăng đều phải qua kiểm duyệt trước khi được hiển thị công khai.</li>
        </ul>
      </aside>
      <article className="mt-10 space-y-10 text-sm leading-7 text-zinc-700">
        <PolicySection title="1. Quy định chung">
          <p>
            Bằng việc truy cập, đăng ký tài khoản hoặc sử dụng bất kỳ tính năng
            nào của nền tảng Trọ Ơi, bạn đồng ý tuân thủ toàn bộ Điều khoản sử
            dụng này. Trọ Ơi là nền tảng trực tuyến giúp kết nối người có nhu
            cầu cho thuê phòng (chủ trọ) và người có nhu cầu tìm phòng (người
            thuê). Chúng tôi không phải là đại lý môi giới, không đại diện cho
            bất kỳ bên nào và không trực tiếp tham gia vào giao dịch thuê phòng.
          </p>
        </PolicySection>
        <PolicySection title="2. Tài khoản và đăng nhập">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Người dùng cần cung cấp thông tin cá nhân chính xác khi đăng ký
              tài khoản.
            </li>
            <li>
              Mỗi cá nhân chỉ nên sở hữu một tài khoản chính chủ để đảm bảo tính
              minh bạch.
            </li>
            <li>
              Bạn có trách nhiệm bảo mật thông tin đăng nhập của mình. Mọi hành
              động phát sinh từ tài khoản của bạn sẽ do bạn chịu trách nhiệm.
            </li>
            <li>
              Trọ Ơi có quyền khóa hoặc xóa tài khoản nếu phát hiện dấu hiệu
              gian lận, lừa đảo, hoặc vi phạm nghiêm trọng điều khoản sử dụng.
            </li>
          </ul>
        </PolicySection>
        <PolicySection title="3. Đăng tin cho thuê">
          <p>
            Chủ trọ có thể sử dụng chức năng đăng tin để giới thiệu phòng trống.
            Khi đăng tin, bạn đồng ý:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Là chủ sở hữu hợp pháp hoặc người được ủy quyền hợp pháp để cho
              thuê bất động sản đó.
            </li>
            <li>
              Cung cấp đầy đủ các thông tin bắt buộc theo yêu cầu của hệ thống
              (giá cả, diện tích, địa chỉ, hình ảnh...).
            </li>
            <li>
              Cập nhật hoặc ẩn tin đăng khi phòng đã được cho thuê để tránh làm
              phiền người tìm phòng.
            </li>
          </ul>
        </PolicySection>
        <PolicySection title="4. Quy tắc đăng tin">
          <p>
            Để xây dựng nền tảng an toàn, mọi tin đăng phải tuân thủ các quy tắc
            sau:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong className="font-medium text-zinc-900">Tính chính xác:</strong>{' '}
              Mô tả, giá phòng, phí dịch vụ phải đúng với thực tế. Không đăng
              giá ảo để câu view.
            </li>
            <li>
              <strong className="font-medium text-zinc-900">Hình ảnh thực tế:</strong>{' '}
              Hình ảnh đính kèm phải là ảnh chụp thật của phòng, không được
              chỉnh sửa làm sai lệch hiện trạng, không chèn watermark của nền
              tảng khác.
            </li>
            <li>
              <strong className="font-medium text-zinc-900">Không vi phạm pháp luật:</strong>{' '}
              Không đăng nội dung phản cảm, phân biệt đối xử, chống phá nhà
              nước, hoặc các dịch vụ trái pháp luật.
            </li>
            <li>
              <strong className="font-medium text-zinc-900">Không lừa đảo:</strong>{' '}
              Tuyệt đối không yêu cầu người thuê chuyển khoản tiền cọc khi chưa
              xem phòng trực tiếp hoặc chưa có hợp đồng rõ ràng.
            </li>
          </ul>
        </PolicySection>
        <PolicySection title="5. Kiểm duyệt và xử lý vi phạm">
          <p>
            Tất cả tin đăng mới hoặc tin được chỉnh sửa đều phải qua hệ thống
            kiểm duyệt (tự động và thủ công) trước khi hiển thị trên Trọ Ơi.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Trọ Ơi có quyền từ chối phê duyệt, ẩn hoặc xóa các tin đăng vi
              phạm quy tắc mà không cần báo trước.
            </li>
            <li>
              Hệ thống sẽ ghi nhận các báo cáo (report) từ người tìm phòng. Nếu
              một tin đăng bị báo cáo lừa đảo nhiều lần, tài khoản đăng tin có
              thể bị khóa vĩnh viễn.
            </li>
            <li>
              Chúng tôi bảo lưu quyền từ chối cung cấp dịch vụ cho các cá nhân
              có lịch sử vi phạm điều khoản liên tục.
            </li>
          </ul>
        </PolicySection>
        <PolicySection title="6. Quyền sở hữu trí tuệ">
          <p>
            Tất cả bản quyền, thương hiệu, thiết kế, mã nguồn và nội dung thuộc
            về Trọ Ơi (ngoại trừ nội dung do người dùng đăng tải) đều là tài sản
            của nền tảng. Việc sao chép, phân phối hoặc sử dụng trái phép các
            tài sản này mà không có sự đồng ý bằng văn bản là vi phạm pháp luật.
          </p>
        </PolicySection>
        <PolicySection title="7. Giới hạn trách nhiệm">
          <p>
            Trọ Ơi nỗ lực kiểm duyệt thông tin nhưng không thể bảo đảm độ chính
            xác tuyệt đối của 100% tin đăng.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Người thuê có trách nhiệm tự kiểm tra phòng, xác minh danh tính
              chủ trọ và đọc kỹ hợp đồng trước khi thực hiện giao dịch hay đặt
              cọc.
            </li>
            <li>
              Trọ Ơi không chịu trách nhiệm pháp lý cho những thiệt hại, tổn
              thất tài chính, hoặc tranh chấp phát sinh giữa người thuê và chủ
              trọ.
            </li>
            <li>
              Hệ thống có thể tạm gián đoạn để bảo trì hoặc nâng cấp, chúng tôi
              không chịu trách nhiệm về các gián đoạn dịch vụ ngoài tầm kiểm
              soát.
            </li>
          </ul>
        </PolicySection>
        <PolicySection title="8. Thay đổi điều khoản">
          <p>
            Trọ Ơi có quyền sửa đổi, bổ sung Điều khoản sử dụng này vào bất kỳ
            lúc nào. Các thay đổi sẽ được thông báo trên website và có hiệu lực
            ngay khi đăng tải. Việc tiếp tục sử dụng dịch vụ sau khi có thay đổi
            đồng nghĩa với việc bạn chấp nhận các điều khoản mới.
          </p>
        </PolicySection>
        <PolicySection title="9. Liên hệ">
          <p>
            Nếu bạn có bất kỳ câu hỏi nào về Điều khoản sử dụng, vui lòng liên
            hệ với chúng tôi qua email: <strong>hotro@trooi.vn</strong>.
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
