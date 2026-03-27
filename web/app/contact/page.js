'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useState } from 'react';
import { api } from '@/lib/api';

export default function ContactPage() {
    const [form, setForm] = useState({
        full_name: '', email: '', phone: '', user_type: 'Buyer', subject: '', message: '',
    });
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setStatus(null);
        try {
            await api.post('/contact', form);
            setStatus({ type: 'success', msg: 'Message sent successfully! We will get back to you soon.' });
            setForm({ full_name: '', email: '', phone: '', user_type: 'Buyer', subject: '', message: '' });
        } catch (err) {
            setStatus({ type: 'error', msg: err.message || 'Failed to send message.' });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="page-wrapper">
            <Navbar />

            <section className="section">
                <div className="container">
                    <h1 className="text-center" style={{ marginBottom: '0.5rem' }}>Contact Us</h1>
                    <p className="text-center text-sm" style={{ fontSize: '1rem', marginBottom: '3rem' }}>
                        Have a question? We would love to hear from you.
                    </p>

                    <div className="grid-2" style={{ maxWidth: 900, margin: '0 auto', alignItems: 'start' }}>
                        {/* Contact Details */}
                        <div>
                            <div className="card" style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ marginBottom: '1rem' }}>Get in Touch</h3>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
                                    <span style={{ fontSize: '1.25rem' }}>📧</span>
                                    <div>
                                        <div className="text-sm" style={{ fontSize: '0.8125rem' }}>Email</div>
                                        <a href="mailto:hello@safedeliver.co" style={{ fontWeight: 600 }}>hello@safedeliver.co</a>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
                                    <span style={{ fontSize: '1.25rem' }}>📱</span>
                                    <div>
                                        <div className="text-sm" style={{ fontSize: '0.8125rem' }}>Phone / WhatsApp</div>
                                        <span style={{ fontWeight: 600 }}>+233 XX XXX XXXX</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
                                    <span style={{ fontSize: '1.25rem' }}>📍</span>
                                    <div>
                                        <div className="text-sm" style={{ fontSize: '0.8125rem' }}>Office</div>
                                        <span style={{ fontWeight: 600 }}>Accra, Ghana</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '1.25rem' }}>🕐</span>
                                    <div>
                                        <div className="text-sm" style={{ fontSize: '0.8125rem' }}>Operating Hours</div>
                                        <span style={{ fontWeight: 600 }}>Mon–Fri, 8:00 AM – 6:00 PM GMT</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="card">
                            <h3 style={{ marginBottom: '1rem' }}>Send Us a Message</h3>

                            {status && (
                                <div className={`alert ${status.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
                                    {status.msg}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Full Name *</label>
                                    <input className="form-input" required value={form.full_name}
                                        onChange={e => setForm({ ...form, full_name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Email Address *</label>
                                    <input className="form-input" type="email" required value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input className="form-input" value={form.phone}
                                        onChange={e => setForm({ ...form, phone: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>I am a *</label>
                                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        {['Seller', 'Buyer', 'Researcher', 'Press', 'Other'].map(type => (
                                            <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 400, fontSize: '0.9375rem', cursor: 'pointer', textTransform: 'none', letterSpacing: 0 }}>
                                                <input type="radio" name="user_type" value={type}
                                                    checked={form.user_type === type}
                                                    onChange={e => setForm({ ...form, user_type: e.target.value })} />
                                                {type}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Subject *</label>
                                    <input className="form-input" required value={form.subject}
                                        onChange={e => setForm({ ...form, subject: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Message * (min 20 characters)</label>
                                    <textarea className="form-input" required minLength={20} value={form.message}
                                        onChange={e => setForm({ ...form, message: e.target.value })} />
                                </div>
                                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                                    {loading ? 'Sending...' : 'Send Message'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
