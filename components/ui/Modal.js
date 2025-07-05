import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useIsMobile } from '@/hooks/useMediaQuery'

export default function Modal({ isOpen, onClose, title, children }) {
  const isMobile = useIsMobile()

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        {/* Modal */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className={`flex min-h-full ${isMobile ? '' : 'items-center justify-center p-4'}`}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom={isMobile ? "translate-y-full" : "opacity-0 scale-95"}
              enterTo={isMobile ? "translate-y-0" : "opacity-100 scale-100"}
              leave="ease-in duration-200"
              leaveFrom={isMobile ? "translate-y-0" : "opacity-100 scale-100"}
              leaveTo={isMobile ? "translate-y-full" : "opacity-0 scale-95"}
            >
              <Dialog.Panel 
                className={`
                  bg-white transform transition-all
                  ${isMobile 
                    ? 'w-full min-h-screen rounded-t-2xl' 
                    : 'w-full max-w-2xl rounded-2xl shadow-xl'
                  }
                `}
              >
                {/* Header */}
                <div className={`
                  sticky top-0 z-10 bg-white border-b border-gray-200
                  ${isMobile ? 'rounded-t-2xl' : 'rounded-t-2xl'}
                `}>
                  <div className="flex items-center justify-between p-4 md:p-6">
                    <Dialog.Title className="text-lg md:text-xl font-semibold text-gray-900">
                      {title}
                    </Dialog.Title>
                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {isMobile && (
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                      <div className="w-12 h-1 bg-gray-300 rounded-full" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 md:p-6">
                  {children}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}