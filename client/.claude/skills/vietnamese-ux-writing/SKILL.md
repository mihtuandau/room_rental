---
name: vietnamese-ux-writing
description: Conventions for all Vietnamese user-facing copy in RoomRent — capitalisation, tone, button labels, error messages, empty states, dates, money, and the canonical term for each domain concept. MUST use this skill whenever writing text a user will read — labels, placeholders, toasts, errors, headings, metadata — even when the user just says "add a button" or "show a message". Inconsistent wording is as visible as inconsistent styling.
---

# Vietnamese UX writing

Backend messages are in English and written for developers. **Everything a user reads is
in Vietnamese and written for them.** Never pass an API message straight to the screen.

## Capitalisation: sentence case, always

Vietnamese does not use title case. Capitalise the first letter and proper nouns only.

| ✅ | ❌ |
|---|---|
| Đăng tin mới | Đăng Tin Mới |
| Tìm phòng trọ | TÌM PHÒNG TRỌ |
| Thông tin liên hệ | Thông Tin Liên Hệ |

This applies to buttons, headings, table columns, tabs and menu items alike.

## Tone

Neutral and helpful, addressing the user as **"bạn"**. Never "quý khách" (stiff,
corporate) and never "mày/tao" or slang. Don't use "tôi/chúng tôi" for the product
unless it is genuinely the company speaking.

- Say what happened and what to do next.
- Don't blame the user. "Số điện thoại không hợp lệ" — not "Bạn đã nhập sai".
- Skip the exclamation marks. One is occasionally fine for a success toast; never two.

## Canonical terms — pick one and never vary

Synonyms make the same thing look like two different things.

| Concept | Use | Never |
|---|---|---|
| A listing | **tin đăng** | bài đăng, bài viết, post |
| The room itself | **phòng** | căn, chỗ ở |
| Post a listing | **đăng tin** | tạo tin, thêm tin |
| Landlord | **chủ trọ** | chủ nhà, người cho thuê |
| Tenant / seeker | **người thuê** | khách thuê, người dùng |
| Save a listing | **lưu tin** | yêu thích, thích, bookmark |
| Saved list | **tin đã lưu** | danh sách yêu thích |
| Amenities | **tiện ích** | tiện nghi, dịch vụ |
| Verified | **đã xác minh** | đã kiểm duyệt, uy tín |
| Awaiting moderation | **chờ duyệt** | đang xét duyệt, chờ phê duyệt |
| Report a listing | **báo cáo** | tố cáo, phản ánh |
| Sign in / up | **đăng nhập** / **đăng ký** | đăng nhập hệ thống |

Room type labels come from `lib/constants.ts` (`ROOM_TYPE_LABELS`) — never retype them
inline, or "Chung cư mini" becomes "Chung cư Mini" somewhere.

## Buttons: a verb, or a verb plus its object

Two to three words. The label states what happens when it's pressed.

| ✅ | ❌ |
|---|---|
| Đăng tin | Gửi |
| Lưu thay đổi | OK |
| Xoá tin đăng | Đồng ý |
| Xem số điện thoại | Nhấn vào đây |
| Thử lại | Retry |

In a confirmation dialog the primary button repeats the action — "Xoá tin đăng", not
"Đồng ý" — so a user who only reads the buttons still understands the consequence.
The cancel button is always **Huỷ**.

While pending, use the progressive form with an ellipsis: `Đang lưu…`, `Đang tải lên…`,
`Đang đăng nhập…` (a real `…`, not three dots).

## Error messages: cause + way forward

| Situation | Copy |
|---|---|
| Invalid phone | Số điện thoại không hợp lệ. |
| Wrong credentials | Số điện thoại hoặc mật khẩu không đúng. |
| Password too short | Mật khẩu cần tối thiểu 8 ký tự. |
| Wrong OTP | Mã xác minh không đúng. |
| Expired OTP | Mã xác minh đã hết hạn. Bấm gửi lại để nhận mã mới. |
| Network failure | Không kết nối được máy chủ. Kiểm tra mạng và thử lại. |
| Needs sign-in (401) | Bạn cần đăng nhập để tiếp tục. |
| Not allowed (403) | Bạn không có quyền thực hiện thao tác này. |
| Too many requests (429) | Bạn thao tác hơi nhanh. Đợi một chút rồi thử lại. |
| Missing contact phone before posting | Bạn cần thêm số điện thoại liên hệ trước khi đăng tin. |
| Image too large | Ảnh vượt quá 5MB. Chọn ảnh nhỏ hơn nhé. |
| Image limit reached | Mỗi tin chỉ đăng tối đa 10 ảnh. |

Field errors end with a full stop and appear next to the field. Toasts may drop the
full stop if the message is a short fragment — but be consistent within a screen.

## Success messages: state the outcome, not the mechanics

| ✅ | ❌ |
|---|---|
| Đã gửi tin, đang chờ admin duyệt. | Tạo tin thành công! |
| Đã lưu thay đổi. | Update thành công |
| Đã lưu tin. | Thêm vào yêu thích thành công! |
| Đã gửi báo cáo. Cảm ơn bạn. | Report submitted |

Prefer the perfective **"Đã …"** — it confirms the thing is done.

## Placeholders are examples, not instructions

The label says what the field is; the placeholder shows what an answer looks like.

| Field | Label | Placeholder |
|---|---|---|
| Phone | Số điện thoại | 0912345678 |
| Title | Tiêu đề tin đăng | Phòng trọ đầy đủ nội thất gần ĐH Bách Khoa |
| Price | Giá thuê (VNĐ/tháng) | 2500000 |
| Search | — | Tìm theo khu vực, tên đường… |

Never use the placeholder as the only label — it disappears on focus and screen readers
handle it poorly.

## Numbers, money, dates

- Money: `2.500.000 ₫` (dot separators). Compact form on cards: `2,5 triệu/tháng` — comma
  as the decimal mark, per Vietnamese convention. Use the helpers in `lib/utils.ts`.
- Area: `25 m²`. Rooms: `2 phòng ngủ`.
- Relative time under a week: `3 giờ trước`, `2 ngày trước` (`date-fns` with the `vi` locale).
  Older than that, an absolute date: `12/07/2026` (dd/MM/yyyy).
- Never render a raw ISO timestamp.

## Metadata and SEO copy

Titles follow `<what> <where> — <qualifier> | RoomRent`, for example
"Phòng trọ Quận 7 — giá tốt, tin xác minh | RoomRent". Keep the title under ~60
characters and the description 120–155 so search engines don't truncate mid-word.

## Do NOT
- Show an English backend message to a user.
- Use Title Case or ALL CAPS for Vietnamese text.
- Mix synonyms for the same concept across screens.
- Label a button "OK", "Gửi", "Đồng ý" or "Nhấn vào đây".
- Write an error that only says what went wrong without saying what to do.
- Use "quý khách", or exclamation marks in error text.

## Checklist
- [ ] Sentence case throughout
- [ ] Addresses the user as "bạn"
- [ ] Uses the canonical term from the table
- [ ] Buttons name the action; cancel is "Huỷ"
- [ ] Pending labels use "Đang …"
- [ ] Errors give a cause and a next step
- [ ] Money/area/date formatted through the shared helpers
- [ ] No backend message shown verbatim
