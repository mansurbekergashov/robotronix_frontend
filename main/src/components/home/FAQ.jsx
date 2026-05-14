import { useState } from 'react'

const FAQ = () => {
    const [activeIndex, setActiveIndex] = useState(null)

    const faqs = [
        {
            question: 'Sertifikatlar qonuniymi?',
            answer: 'Ha, bizning sertifikatlarimiz rasmiy litsenziya asosida beriladi va maktab o\'qituvchilari uchun tarifikatsiya jarayonida inobatga olinadi (edo.ijro.uz bazasiga kiritiladi).'
        },
        {
            question: 'Online kursda o\'rganish qiyin emasmi?',
            answer: 'Yo\'q, bizning online darslarimiz maxsus metodika asosida, sodda tilda va to\'liq videoqo\'llanmalar bilan tashkil etilgan. 500 dan ortiq ustozlar muvaffaqiyatli bitirgan.'
        },
        {
            question: 'Farzandim 5 yoshda, unga qanday kurs mos keladi?',
            answer: '5 yoshli bolalar uchun LEGO konstruktorlari yordamida mantiqiy fikrlashni rivojlantiruvchi "Mitti Muhandis" kursimiz mavjud.'
        },
        {
            question: 'To\'lovni bo\'lib to\'lasa bo\'ladimi?',
            answer: 'Ha, kurslar va katta to\'plamlar uchun Uzum Nasiya, Alif Nasiya kabi hamkorlarimiz orqali muddatli to\'lov imkoniyati mavjud.'
        }
    ]

    const toggleFAQ = (index) => {
        setActiveIndex(activeIndex === index ? null : index)
    }

    return (
        <section className="faq" data-aos="fade-up">
            <div className="container">
                <div className="section-header">
                    <h2 className="section-title">Tez-tez beriladigan savollar</h2>
                    <p className="section-subtitle">
                        Eng mashhur savollar va javoblar
                    </p>
                </div>

                <div className="faq-list">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className={`faq-item ${activeIndex === index ? 'active' : ''}`}
                        >
                            <div className="faq-question" onClick={() => toggleFAQ(index)}>
                                <h4>{faq.question}</h4>
                                <i className="fas fa-chevron-down"></i>
                            </div>
                            <div className="faq-answer">
                                <p>{faq.answer}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default FAQ
