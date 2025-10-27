import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'

export const Modal = ({ isOpen, onClose, title, children }) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                {/* Background */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" />
                </Transition.Child>

                {/* Modal */}
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95 translate-y-4"
                        enterTo="opacity-100 scale-100 translate-y-0"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100 translate-y-0"
                        leaveTo="opacity-0 scale-95 translate-y-4"
                    >
                        <Dialog.Panel
                            className="
                                w-full 
                                max-w-3xl
                                bg-white 
                                rounded-xl 
                                shadow-xl 
                                p-8
                                outline-none
                                transition-all
                            "
                        >
                            {/* Header */}
                            {title && (
                                <Dialog.Title className="text-xl font-semibold text-gray-900 mb-4">
                                    {title}
                                </Dialog.Title>
                            )}

                            {/* Conteúdo */}
                            {children}
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    )
}
