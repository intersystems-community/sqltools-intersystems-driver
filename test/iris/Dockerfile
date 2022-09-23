FROM containers.intersystems.com/intersystems/iris-community:2022.1.0.209.0

RUN iris start $ISC_PACKAGE_INSTANCENAME && \
    iris session $ISC_PACKAGE_INSTANCENAME -U%SYS '##class(Security.Users).UnExpireUserPasswords("*")' && \
    iris stop $ISC_PACKAGE_INSTANCENAME quietly 