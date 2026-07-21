import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Kiến thức Lập trình',
    Svg: require('@site/static/img/feature-programming.svg').default,
    description: (
      <>
        Kinh nghiệm thực chiến với C#, Java, JavaScript, PHP, AI-Robotics
        và AutoIT từ các dự án thực tế.
      </>
    ),
  },
  {
    title: 'Giải pháp ERP',
    Svg: require('@site/static/img/feature-erp.svg').default,
    description: (
      <>
        Chia sẻ nghiệp vụ, quy trình triển khai và các bài toán thường gặp
        khi xây dựng hệ thống ERP.
      </>
    ),
  },
  {
    title: 'Database & Backend',
    Svg: require('@site/static/img/feature-database.svg').default,
    description: (
      <>
        SQL Server, Stored Procedure, tối ưu truy vấn và các lỗi thường
        gặp khi làm việc với dữ liệu.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}