import { AppSkeleton } from '@/components/ui';

const ProductLoading = () => (
  <main className="container px-8 flex items-start md:flex-row flex-col justify-center w-full gap-12">
    <div className="min-w-full md:min-w-[40%] sticky left-0 top-24">
      <div className="flex flex-col justify-center items-center gap-5">
        <AppSkeleton
          appVariant="image"
          appClassName="max-w-[600px] max-h-[600px] w-full"
        />
        <div className="grid grid-cols-4 gap-5 md:gap-0 lg:gap-5 w-full h-full">
          {Array.from({ length: 4 }).map((value: any, index: number) => (
            <AppSkeleton
              key={index}
              appVariant={'image'}
              appClassName="max-w-[132px] max-h-[132px] w-full"
            />
          ))}
        </div>
      </div>
    </div>
    <div className="flex flex-col gap-9 min-w-full md:min-w-[60%] h-full">
      <AppSkeleton appClassName="h-12 w-full" />
      <div className="w-full flex flex-col gap-9 h-full">
        <AppSkeleton appClassName="h-12 w-[50%]" />
        <div className="flex flex-col gap-9 w-full h-full">
          <div className="flex flex-col gap-6 w-full h-full">
            <div className="flex items-center justify-start w-64 h-full gap-2">
              <AppSkeleton hard appClassName="h-5 w-12" />
              <AppSkeleton hard appClassName="h-2 w-2" appVariant="circle" />
              <AppSkeleton hard appClassName="h-5 w-16" />
            </div>
            <div className="flex items-center justify-start w-full gap-4">
              <AppSkeleton
                hard
                appClassName="w-12 h-12 rounded-sm"
                appVariant="image"
              />
              <AppSkeleton
                hard
                appClassName="w-12 h-12 rounded-sm"
                appVariant="image"
              />
              <AppSkeleton
                hard
                appClassName="w-12 h-12 rounded-sm"
                appVariant="image"
              />
            </div>
          </div>
          <div className="flex flex-col gap-6 w-full h-full">
            <div className="flex items-center justify-start w-64 h-full gap-2">
              <AppSkeleton hard appClassName="h-5 w-12" />
              <AppSkeleton hard appClassName="h-2 w-2" appVariant="circle" />
              <AppSkeleton hard appClassName="h-5 w-8" />
            </div>
            <div className="flex items-center justify-start w-full gap-4">
              <AppSkeleton
                hard
                appClassName="w-12 h-12 rounded"
                appVariant="image"
              />
              <AppSkeleton
                hard
                appClassName="w-12 h-12 rounded"
                appVariant="image"
              />
              <AppSkeleton
                hard
                appClassName="w-12 h-12 rounded"
                appVariant="image"
              />
              <AppSkeleton
                hard
                appClassName="w-12 h-12 rounded"
                appVariant="image"
              />
              <AppSkeleton
                hard
                appClassName="w-12 h-12 rounded"
                appVariant="image"
              />
            </div>
          </div>
          <div className="flex flex-col gap-6 w-full h-full">
            <AppSkeleton appClassName="h-5 w-12" />
            <div className="border rounded-sm flex items-center justify-between w-32 p-3">
              <AppSkeleton
                hard
                appClassName="w-6 h-6 rounded"
                appVariant="image"
              />
              <AppSkeleton hard appClassName="h-6 w-4" />
              <AppSkeleton
                hard
                appClassName="w-6 h-6 rounded"
                appVariant="image"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <AppSkeleton appClassName="w-32 h-6 rounded" />
          </div>
        </div>
      </div>
    </div>
  </main>
);

export default ProductLoading;
