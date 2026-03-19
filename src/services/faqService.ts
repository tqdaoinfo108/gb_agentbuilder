import Fuse from 'fuse.js';

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

const STORAGE_KEY = 'chatbot_faqs';

const DEFAULT_FAQS: FAQ[] = [
  {
    id: '1',
    question: 'Làm sao để đặt hàng?',
    answer: 'Để đặt hàng, bạn vui lòng chọn sản phẩm vào giỏ hàng, sau đó vào giỏ hàng và nhấn nút "Thanh toán". Điền đầy đủ thông tin giao hàng và chọn phương thức thanh toán phù hợp nhé.'
  },
  {
    id: '2',
    question: 'Thời gian giao hàng là bao lâu?',
    answer: 'Thời gian giao hàng thường từ 2-4 ngày làm việc đối với khu vực nội thành, và 3-7 ngày làm việc đối với khu vực ngoại thành hoặc tỉnh lẻ.'
  },
  {
    id: '3',
    question: 'Chính sách đổi trả như thế nào?',
    answer: 'Chúng tôi hỗ trợ đổi trả trong vòng 7 ngày kể từ ngày nhận hàng nếu sản phẩm bị lỗi do nhà sản xuất hoặc không đúng mô tả. Vui lòng giữ nguyên tem mác và bao bì.'
  },
  {
    id: '4',
    question: 'Shop có miễn phí vận chuyển không?',
    answer: 'Chúng tôi miễn phí vận chuyển cho các đơn hàng có giá trị từ 500.000đ trở lên trên toàn quốc.'
  },
  {
    id: '5',
    question: 'Làm sao để liên hệ với tổng đài hỗ trợ?',
    answer: 'Bạn có thể liên hệ với tổng đài hỗ trợ qua số hotline 1900 xxxx hoặc gửi email về địa chỉ support@example.com. Chúng tôi làm việc từ 8h00 đến 22h00 hàng ngày.'
  }
];

const normalizeText = (text: string) => {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d");
};

export const faqService = {
  getFAQs(): FAQ[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse FAQs from localStorage', e);
      }
    }
    // Seed default FAQs if none exist
    this.saveFAQs(DEFAULT_FAQS);
    return DEFAULT_FAQS;
  },

  saveFAQs(faqs: FAQ[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(faqs));
  },

  addFAQ(question: string, answer: string): FAQ {
    const faqs = this.getFAQs();
    const newFAQ: FAQ = {
      id: Date.now().toString(),
      question,
      answer
    };
    faqs.push(newFAQ);
    this.saveFAQs(faqs);
    return newFAQ;
  },

  deleteFAQ(id: string) {
    const faqs = this.getFAQs();
    const filtered = faqs.filter(f => f.id !== id);
    this.saveFAQs(filtered);
  },

  findBestMatch(query: string): FAQ | null {
    const faqs = this.getFAQs();
    const normalizedQuery = normalizeText(query);

    // Tạo mảng dữ liệu đã chuẩn hóa để tìm kiếm chính xác hơn với tiếng Việt
    const searchData = faqs.map(faq => ({
      ...faq,
      normalizedQuestion: normalizeText(faq.question)
    }));

    const fuse = new Fuse(searchData, {
      keys: ['normalizedQuestion'],
      threshold: 0.5, // Tăng độ mờ (fuzziness) để dễ khớp hơn với câu hỏi không giống hoàn toàn
      includeScore: true,
      ignoreLocation: true, // Bỏ qua vị trí từ khóa (tìm ở bất cứ đâu trong câu)
    });

    const results = fuse.search(normalizedQuery);
    
    // Ngưỡng chấp nhận kết quả (càng nhỏ càng chính xác, 0.5 là mức vừa phải)
    if (results.length > 0 && results[0].score !== undefined && results[0].score <= 0.55) {
      const matchedId = results[0].item.id;
      return faqs.find(f => f.id === matchedId) || null;
    }
    return null;
  }
};
