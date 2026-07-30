import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import SquiggleUnderline from '@/components/ui/SquiggleUnderline';
import type { Locale } from '@/lib/i18n';

/** Avatar per testimonial; quote, name and role come from `home.testimonials.items.<key>`. */
const TESTIMONIALS = [
  { key: 'maria', avatarSrc: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { key: 'lukas', avatarSrc: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { key: 'elena', avatarSrc: 'https://randomuser.me/api/portraits/women/68.jpg' },
] as const;

export default async function Testimonials({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home.testimonials' });

  return (
    <section className="bg-brand-cream px-6 pb-16 pt-14 lg:px-10">
      <div className="mx-auto w-full max-w-[2000px]">
        <div className="mb-7">
          <h2 className="font-serif text-[32px] font-medium leading-none tracking-[-0.03em] text-brand-ink">
            {t('heading')}
          </h2>

          <SquiggleUnderline />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <figure
              key={testimonial.key}
              className="flex flex-col justify-between rounded-[15px] border border-brand-border bg-white p-6 shadow-[0_8px_24px_rgba(75,55,35,0.06)]"
            >
              <blockquote className="relative">
                <span
                  aria-hidden="true"
                  className="block font-serif text-[34px] font-bold leading-none text-brand-terracotta"
                >
                  &ldquo;
                </span>

                <p className="mt-1 text-[14px] leading-6 text-brand-ink">
                  {t(`items.${testimonial.key}.quote`)}
                </p>
              </blockquote>

              <figcaption className="mt-5 flex items-center gap-3">
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-brand-border">
                  <Image
                    src={testimonial.avatarSrc}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </span>

                <span>
                  <span className="block text-[14px] font-bold leading-5 text-brand-ink">
                    {t(`items.${testimonial.key}.name`)}
                  </span>
                  <span className="block text-[12px] leading-4 text-brand-muted">
                    {t(`items.${testimonial.key}.role`)}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
