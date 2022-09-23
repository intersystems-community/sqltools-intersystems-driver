FROM intersystemsdc/iris-community:preview

RUN iris start $ISC_PACKAGE_INSTANCENAME && \
    iris session $ISC_PACKAGE_INSTANCENAME -U%SYS '##class(Security.Users).UnExpireUserPasswords("*")' && \
    iris stop $ISC_PACKAGE_INSTANCENAME quietly 